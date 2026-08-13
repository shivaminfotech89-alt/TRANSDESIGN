/**
 * One-time (but safe to run more than once) backfill for syncOrgClaims
 * (../claims.ts). That trigger only fires on a WRITE to a member document,
 * so every member added before it was deployed carries no custom claim at
 * all -- storage.rules would deny them a read they are actually entitled
 * to until either their membership document happens to be written again,
 * or this runs.
 *
 * Iterates every org, every member of it, and sets exactly the claim
 * syncOrgClaims itself would set for that document today -- same shape,
 * same merge-with-existing-claims behaviour, so a user in several orgs
 * only touched by this script for one of them keeps every other org's
 * claim untouched.
 *
 * Idempotent: skips (and logs as "ok, unchanged") any member whose claim
 * already matches their current role, so a second run reports 0 changed
 * rather than doing redundant writes -- BUILD-GUIDE.md's deployment
 * section runs this a second time specifically to prove that.
 *
 * Run from functions/: npm run backfill-claims
 * Needs credentials with access to this project -- see BUILD-GUIDE.md's
 * deployment section for the exact command, not just "be authenticated."
 */
import { db, auth } from "../admin";

interface Result {
  changed: number;
  unchanged: number;
  noAuthUser: number;
  errors: number;
}

async function backfill(): Promise<Result> {
  const result: Result = { changed: 0, unchanged: 0, noAuthUser: 0, errors: 0 };

  const orgsSnap = await db.collection("orgs").get();
  console.log(`Found ${orgsSnap.size} organisation(s).`);

  for (const orgDoc of orgsSnap.docs) {
    const orgId = orgDoc.id;
    const membersSnap = await db.collection(`orgs/${orgId}/members`).get();
    console.log(`\norg ${orgId}: ${membersSnap.size} member(s)`);

    for (const memberDoc of membersSnap.docs) {
      const uid = memberDoc.id;
      const role = memberDoc.data()?.role as string | undefined;
      if (!role) {
        console.log(`  skip uid ${uid}: member document has no role field`);
        continue;
      }

      let user;
      try {
        user = await auth.getUser(uid);
      } catch (err) {
        console.log(`  skip uid ${uid}: no Auth user exists for this id (${String(err)})`);
        result.noAuthUser++;
        continue;
      }

      try {
        const claims = { ...(user.customClaims || {}) } as { orgs?: Record<string, string> };
        const orgs = { ...(claims.orgs || {}) };
        if (orgs[orgId] === role) {
          console.log(`  ok   uid ${uid}: already ${role}`);
          result.unchanged++;
          continue;
        }
        orgs[orgId] = role;
        claims.orgs = orgs;
        await auth.setCustomUserClaims(uid, claims);
        console.log(`  set  uid ${uid}: ${role}`);
        result.changed++;
      } catch (err) {
        console.error(`  FAIL uid ${uid}:`, err);
        result.errors++;
      }
    }
  }

  return result;
}

backfill()
  .then((result) => {
    console.log(
      `\nDone. ${result.changed} changed, ${result.unchanged} already correct, ` +
      `${result.noAuthUser} had no Auth user, ${result.errors} errors.`,
    );
    if (result.errors > 0) process.exitCode = 1;
  })
  .catch((err) => {
    console.error("Backfill failed to run at all:", err);
    process.exitCode = 1;
  });

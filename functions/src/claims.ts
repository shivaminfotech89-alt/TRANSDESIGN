import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import { auth } from "./admin";

/**
 * Resolves the named-database problem for Storage Security Rules
 * (storage.rules, CLAUDE.md) -- storage.rules cannot call
 * firestore.get()/exists() against a named Firestore database, only
 * (default), which this project never writes to. Mirroring org membership
 * onto the user's own Auth custom claims sidesteps the limitation entirely:
 * storage.rules reads request.auth.token.orgs[orgId] directly, no
 * cross-service Firestore lookup at all.
 *
 * The alternative worth naming and rejecting: mirroring membership data
 * into the (default) database instead, so storage.rules' firestore.get()
 * would actually find it. Rejected because (default) is shared with other,
 * unrelated apps in this same Firebase project (CLAUDE.md) -- writing this
 * app's authorization data into a database another app also reads from is
 * exactly the cross-contamination the named-database split exists to avoid.
 * Custom claims live on the user's own Auth token, not in any Firestore
 * database, so this problem does not arise.
 *
 * Claims are a full replace, not a merge (admin.auth().setCustomUserClaims),
 * so this always reads the user's current claims first and only changes the
 * one org key that triggered the write -- a user in several orgs keeps every
 * other membership's claim untouched by an edit to one of them.
 */
export const syncOrgClaims = onDocumentWritten(
  { document: "orgs/{orgId}/members/{uid}", database: "ai-studio-transdesignengin-41442703-2634-4bab-af2b-b96345bc6846" },
  async (event) => {
    const { orgId, uid } = event.params;
    const after = event.data?.after;
    const role: string | null = after?.exists ? (after.data()?.role ?? null) : null;

    let user;
    try {
      user = await auth.getUser(uid);
    } catch (err) {
      // The member document's own uid is not a real Auth user -- can happen
      // for a stale or hand-edited document. Nothing to set a claim on;
      // logged, not thrown, since retrying a Firestore trigger for a user
      // that will never exist just retries forever.
      logger.warn(`syncOrgClaims: no Auth user for uid ${uid} (org ${orgId})`, err);
      return;
    }

    const claims = { ...(user.customClaims || {}) } as { orgs?: Record<string, string> };
    const orgs = { ...(claims.orgs || {}) };
    if (role) orgs[orgId] = role; else delete orgs[orgId];
    claims.orgs = orgs;

    await auth.setCustomUserClaims(uid, claims);
    logger.info(`syncOrgClaims: uid ${uid} org ${orgId} role ${role ?? "(removed)"}`);
  },
);

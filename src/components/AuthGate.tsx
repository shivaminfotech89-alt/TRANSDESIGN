import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { OrgProvider } from './OrgContext';
import { createOrganisation, linkExistingOrg, listMyOrgs, getMyRole } from '../../lib/projects';
import { Card, Button, inputCls, labelCls } from './ui';

/**
 * TASKS.md item 3: sign in (email link or Google), then resolve or create
 * the signed-in user's organisation before anything else in the app renders.
 * Projects cannot be written until org membership exists (BUILD-GUIDE.md
 * section 7), so this gate is the one thing that must run first.
 */
function Screen({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-4">
          <div className="text-[10px] font-display uppercase tracking-[0.4em] text-copper">Design Office</div>
          <h1 className="text-[22px] font-display uppercase text-ink leading-none mt-1">{title}</h1>
        </div>
        <Card title={title}>{children}</Card>
      </div>
    </div>
  );
}

function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="text-[10px] text-alert mt-2">{error}</p>;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const {
    user, loading, signIn, logOut, sendEmailLink, awaitingEmailForLink, completeEmailLinkSignIn,
  } = useAuth();

  const [orgId, setOrgId] = useState<string | null | undefined>(undefined); // undefined = not checked yet
  const [role, setRole] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [orgNameDraft, setOrgNameDraft] = useState('');
  const [linkOrgIdDraft, setLinkOrgIdDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Diagnostic only: the last step reached, and whether the org query has
  // been pending for more than 10s -- shown on the "Checking your
  // organisation" screen instead of spinning forever with no indication of
  // where it stopped.
  const [lastStep, setLastStep] = useState('not started');
  const [orgCheckTimedOut, setOrgCheckTimedOut] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    console.log('[AuthGate] auth state observed: loading =', loading, 'user =', user ? user.uid : null);
  }, [loading, user]);

  useEffect(() => {
    if (!user) { setOrgId(undefined); return; }
    let cancelled = false;
    setError(null);
    setOrgCheckTimedOut(false);
    setLastStep(`org query started for uid ${user.uid}`);
    console.log('[AuthGate] org query started for uid', user.uid);
    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        console.warn('[AuthGate] org query has not settled after 10s -- last step:', `org query started for uid ${user.uid}`);
        setOrgCheckTimedOut(true);
      }
    }, 10000);
    listMyOrgs(user.uid)
      .then((orgs) => {
        console.log('[AuthGate] org query returned', orgs);
        setLastStep(`org query returned, ${orgs.length} org(s)`);
        if (!cancelled) setOrgId(orgs.length ? orgs[0].id : null);
      })
      .catch((e) => {
        // Fail loudly: a permission error (or any other rejection) must be
        // shown, not leave orgId stuck at undefined with the "Checking your
        // organisation" screen spinning over a state nothing ever surfaces.
        console.error('[AuthGate] org query failed', e);
        setLastStep(`org query failed: ${String(e)}`);
        if (!cancelled) setError(String(e));
      })
      .finally(() => clearTimeout(timeoutId));
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [user, retryToken]);

  useEffect(() => {
    if (!user || !orgId) { setRole(null); return; }
    console.log('[AuthGate] membership query started for org', orgId);
    setLastStep(`membership query started for org ${orgId}`);
    getMyRole(orgId, user.uid)
      .then((r) => {
        console.log('[AuthGate] membership resolved, role =', r);
        setLastStep(`membership resolved, role = ${r}`);
        setRole(r);
      })
      .catch((e) => {
        console.error('[AuthGate] membership query failed', e);
        setLastStep(`membership query failed: ${String(e)}`);
        setRole(null);
      });
  }, [user, orgId]);

  if (loading) {
    return <Screen title="Loading"><p className="text-[11px] text-ink2">Checking your session.</p></Screen>;
  }

  if (awaitingEmailForLink) {
    return (
      <Screen title="Confirm Email">
        <p className="text-[11px] text-ink2 mb-3">
          This sign-in link was opened in a different browser. Confirm the email you requested it with.
        </p>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true); setError(null);
            try { await completeEmailLinkSignIn(emailDraft); } catch (err) { setError(String(err)); }
            setBusy(false);
          }}
        >
          <div className="space-y-1">
            <label className={labelCls}>Email</label>
            <input type="email" required value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} className={inputCls} />
          </div>
          <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Confirming' : 'Confirm'}</Button>
        </form>
        <ErrorNote error={error} />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen title="Sign In">
        <div className="space-y-4">
          <Button
            variant="primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true); setError(null);
              try { await signIn(); } catch (err) { setError(String(err)); }
              setBusy(false);
            }}
          >
            {busy ? 'Signing In' : 'Sign In With Google'}
          </Button>
          <div className="text-center text-[10px] font-display uppercase tracking-[0.14em] text-steel">Or</div>
          {linkSent ? (
            <p className="text-[11px] text-good">Sign-in link sent to {emailDraft}. Check your inbox.</p>
          ) : (
            <form
              className="space-y-2"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true); setError(null);
                try { await sendEmailLink(emailDraft); setLinkSent(true); } catch (err) { setError(String(err)); }
                setBusy(false);
              }}
            >
              <div className="space-y-1">
                <label className={labelCls}>Email</label>
                <input type="email" required placeholder="you@company.com" value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} className={inputCls} />
              </div>
              <Button type="submit" variant="secondary" disabled={busy}>{busy ? 'Sending' : 'Email Me a Sign-In Link'}</Button>
            </form>
          )}
        </div>
        <ErrorNote error={error} />
      </Screen>
    );
  }

  if (orgId === undefined) {
    if (error) {
      // A rejected promise here used to be caught, stored in `error`, and
      // never rendered -- the screen stayed on "Checking your organisation"
      // forever with the failure sitting silently in state. This is the fix:
      // an error ends the spinner and is shown, always.
      return (
        <Screen title="Could Not Check Your Organisation">
          <p className="text-[11px] text-ink2 mb-2">
            The organisation lookup failed. This is the actual error, not a hang.
          </p>
          <ErrorNote error={error} />
          <p className="text-[10px] font-mono text-steel mt-2">Last step: {lastStep}</p>
          <Button
            variant="primary"
            onClick={() => { setError(null); setRetryToken((t) => t + 1); }}
            disabled={busy}
          >
            Retry
          </Button>
        </Screen>
      );
    }
    return (
      <Screen title="Loading">
        <p className="text-[11px] text-ink2">Checking your organisation.</p>
        {orgCheckTimedOut && (
          <div className="mt-3 pt-3 border-t border-line">
            <p className="text-[10px] text-alert mb-1">
              This has taken more than 10 seconds. The query is neither succeeding nor throwing, which usually
              means a Firestore request is not resolving at all rather than failing cleanly.
            </p>
            <p className="text-[10px] font-mono text-steel">Last step: {lastStep}</p>
            <p className="text-[10px] text-steel mt-1">
              Check the browser console for [firebase]/[AuthContext]/[AuthGate] diagnostic logs.
            </p>
          </div>
        )}
      </Screen>
    );
  }

  if (orgId === null) {
    return (
      <Screen title="Create Your Organisation">
        <p className="text-[11px] text-ink2 mb-3">
          Signed in as <span className="font-mono">{user.email}</span>. No organisation yet, so there is nowhere
          to put a project. This creates the organisation, adds you as owner, and seeds a rate card from the
          engine defaults.
        </p>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true); setError(null);
            try {
              const id = await createOrganisation(user.uid, user.email || '', orgNameDraft);
              setOrgId(id);
            } catch (err) { setError(String(err)); }
            setBusy(false);
          }}
        >
          <div className="space-y-1">
            <label className={labelCls}>Company Name</label>
            <input required value={orgNameDraft} onChange={(e) => setOrgNameDraft(e.target.value)} className={inputCls} />
          </div>
          <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Creating' : 'Create Organisation'}</Button>
        </form>
        <ErrorNote error={error} />

        <div className="mt-5 pt-4 border-t border-line">
          <p className="text-[10px] text-ink2 mb-2">
            Already a member of an organisation, but it is not showing up? That happens for an account created
            before this account-linking record existed. Enter the organisation ID to link it to your account --
            you can find it in the Firebase console, Firestore, the <span className="font-mono">orgs</span>{' '}
            collection.
          </p>
          <form
            className="space-y-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true); setError(null);
              try {
                await linkExistingOrg(linkOrgIdDraft.trim(), user.uid, user.email || '');
                setOrgId(linkOrgIdDraft.trim());
              } catch (err) { setError(String(err)); }
              setBusy(false);
            }}
          >
            <div className="space-y-1">
              <label className={labelCls}>Organisation ID</label>
              <input required value={linkOrgIdDraft} onChange={(e) => setLinkOrgIdDraft(e.target.value)} className={inputCls} />
            </div>
            <Button type="submit" variant="secondary" disabled={busy}>{busy ? 'Linking' : 'Link Existing Organisation'}</Button>
          </form>
        </div>

        <button onClick={logOut} className="text-[10px] font-display uppercase tracking-[0.1em] text-steel mt-4 underline underline-offset-2">
          Sign Out
        </button>
      </Screen>
    );
  }

  return <OrgProvider orgId={orgId} role={role}>{children}</OrgProvider>;
}

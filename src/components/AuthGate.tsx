import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { OrgProvider } from './OrgContext';
import { createOrganisation, listMyOrgs, getMyRole } from '../../lib/projects';
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setOrgId(undefined); return; }
    let cancelled = false;
    listMyOrgs(user.uid)
      .then((orgs) => { if (!cancelled) setOrgId(orgs.length ? orgs[0].id : null); })
      .catch((e) => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!user || !orgId) { setRole(null); return; }
    getMyRole(orgId, user.uid).then(setRole).catch(() => setRole(null));
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
          <Button variant="primary" onClick={signIn}>Sign In With Google</Button>
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
    return <Screen title="Loading"><p className="text-[11px] text-ink2">Checking your organisation.</p></Screen>;
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
        <button onClick={logOut} className="text-[10px] font-display uppercase tracking-[0.1em] text-steel mt-4 underline underline-offset-2">
          Sign Out
        </button>
      </Screen>
    );
  }

  return <OrgProvider orgId={orgId} role={role}>{children}</OrgProvider>;
}

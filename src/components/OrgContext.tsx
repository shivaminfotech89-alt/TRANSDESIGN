import React, { createContext, useContext } from 'react';

/**
 * Provided by AuthGate once a signed-in user's organisation is resolved.
 * TASKS.md item 5 (projects and revisions) reads this rather than
 * re-resolving membership itself.
 */
interface OrgContextType {
  orgId: string;
  role: string | null;
}

const OrgContext = createContext<OrgContextType | null>(null);

export function OrgProvider({ orgId, role, children }: { orgId: string; role: string | null; children: React.ReactNode }) {
  return <OrgContext.Provider value={{ orgId, role }}>{children}</OrgContext.Provider>;
}

/** Only valid inside AuthGate's authenticated-with-org branch. */
export function useOrg(): OrgContextType {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg() called outside OrgProvider -- AuthGate has not resolved an organisation yet.');
  return ctx;
}

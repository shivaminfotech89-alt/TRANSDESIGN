import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../../lib/firebase';
import {
  onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider, User,
  sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
} from 'firebase/auth';

const EMAIL_STORAGE_KEY = 'transdesign_email_for_sign_in';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  /** TASKS.md item 3: email link, the other half of "email link and Google". */
  sendEmailLink: (email: string) => Promise<void>;
  /** True when the current URL is a valid sign-in link but opened in a
   *  browser/device that never requested it, so the cached email is missing
   *  and the UI must ask for it before completeEmailLinkSignIn can run. */
  awaitingEmailForLink: boolean;
  completeEmailLinkSignIn: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [awaitingEmailForLink, setAwaitingEmailForLink] = useState(false);

  useEffect(() => {
    console.log('[AuthContext] subscribing to onAuthStateChanged');
    const unsubscribe = onAuthStateChanged(
      auth,
      (u) => {
        console.log('[AuthContext] onAuthStateChanged fired, user =', u ? { uid: u.uid, email: u.email } : null);
        setUser(u);
        setLoading(false);
      },
      (error) => {
        // onAuthStateChanged's callback almost never sees an error, but if
        // Firebase Auth itself is misconfigured (bad API key, wrong
        // authDomain) this is the one place it would surface -- otherwise
        // the callback above simply never fires, which is the silent-hang
        // this instrumentation exists to catch.
        console.error('[AuthContext] onAuthStateChanged error', error);
      },
    );
    return unsubscribe;
  }, []);

  // Landing back from an email sign-in link: complete it with the email we
  // cached when it was sent, or ask for it if this is a different browser.
  useEffect(() => {
    if (!isSignInWithEmailLink(auth, window.location.href)) return;
    const cachedEmail = window.localStorage.getItem(EMAIL_STORAGE_KEY);
    if (!cachedEmail) {
      setAwaitingEmailForLink(true);
      return;
    }
    signInWithEmailLink(auth, cachedEmail, window.location.href)
      .then(() => {
        window.localStorage.removeItem(EMAIL_STORAGE_KEY);
        window.history.replaceState(null, '', window.location.pathname);
      })
      .catch((error) => console.error(error));
  }, []);

  const signIn = async () => {
    // Popup blocked, closed by the user, or an unauthorised-domain
    // misconfiguration all reject this promise. Swallowing it here (as this
    // used to) means clicking "Sign In With Google" does nothing visible at
    // all -- the same silent-failure shape as the org-lookup hang. Let it
    // propagate so AuthGate's caller can show it.
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const sendEmailLink = async (email: string) => {
    await sendSignInLinkToEmail(auth, email, {
      url: window.location.href,
      handleCodeInApp: true,
    });
    window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
  };

  const completeEmailLinkSignIn = async (email: string) => {
    await signInWithEmailLink(auth, email, window.location.href);
    window.localStorage.removeItem(EMAIL_STORAGE_KEY);
    setAwaitingEmailForLink(false);
    window.history.replaceState(null, '', window.location.pathname);
  };

  const logOut = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, signIn, logOut, sendEmailLink, awaitingEmailForLink, completeEmailLinkSignIn,
    }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './components/AuthContext.tsx';
import { AuthGate } from './components/AuthGate.tsx';
import { ReportEntry } from './report/ReportEntry.tsx';

// TASKS.md item 10: /report/{orgId}/{projectId}/{rev} is the Cloud
// Function's own headless render target (functions/src/index.ts) -- it
// carries its own identity (a Firebase custom token in sessionStorage, see
// ReportEntry) and must never go through AuthProvider/AuthGate's
// interactive login and org-resolution flow. Checked before anything else
// mounts, not as a route inside <App/>, since this app has no router and
// AuthGate would otherwise run first regardless.
const isReportRoute = window.location.pathname.startsWith('/report/');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isReportRoute ? (
      <ReportEntry />
    ) : (
      <AuthProvider>
        <AuthGate>
          <App />
        </AuthGate>
      </AuthProvider>
    )}
  </StrictMode>
);

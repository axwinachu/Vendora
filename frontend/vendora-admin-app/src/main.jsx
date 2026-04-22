import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import keycloak from './keycloak/keycloak.js';

keycloak.init({
  onLoad: 'login-required',
  checkLoginIframe: false,        // prevents silent iframe 403 noise in dev
}).then((authenticated) => {

  if (!authenticated) {
    console.error('User not authenticated');
    return;
  }

  // ── Role check using REALM roles (not resource_access / client roles) ──────
  // Your backend uses realm roles: ADMIN, PROVIDER, USER
  // Realm roles live at tokenParsed.realm_access.roles
  // resource_access is for CLIENT roles — that was the mismatch causing 403s
  const realmRoles = keycloak.tokenParsed?.realm_access?.roles || [];

  console.log('Realm roles:', realmRoles);

  if (!realmRoles.includes('ADMIN')) {
    document.body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                  height:100vh;font-family:sans-serif;gap:12px">
        <h2 style="color:#dc2626">Access Denied</h2>
        <p style="color:#6b7280">You need the ADMIN role to access this console.</p>
        <button onclick="window.location.href='/'" 
          style="padding:8px 20px;border-radius:6px;border:1px solid #d1d5db;cursor:pointer">
          Go back
        </button>
      </div>`;
    return;
  }

  // ── Mount the app ──────────────────────────────────────────────────────────
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  // ── Token refresh — refresh 60s before expiry, check every 30s ───────────
  // Do NOT store the token in localStorage — it's a security risk (XSS).
  // The keycloak object itself always holds the latest token; api.js reads it directly.
  setInterval(() => {
    keycloak.updateToken(60)
      .then((refreshed) => {
        if (refreshed) {
          console.debug('Token refreshed silently');
        }
      })
      .catch(() => {
        console.error('Token refresh failed — forcing re-login');
        keycloak.login();           // redirect to Keycloak login instead of going silent
      });
  }, 30_000);

}).catch((error) => {
  console.error('Keycloak init failed', error);
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif">
      <p style="color:#dc2626">Authentication service unavailable. Please try again later.</p>
    </div>`;
});
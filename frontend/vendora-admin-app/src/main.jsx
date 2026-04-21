import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import keycloak from './keycloak/keycloak.js';

keycloak.init({
  onLoad: 'login-required'
}).then((authenticated) => {
  
  if (authenticated) {
    console.log("User authenticated");
    const roles = keycloak.tokenParsed?.resource_access?.["vendora-admin-app"]?.roles || [];

    console.log("User roles:", roles);
    if (!roles.includes("ADMIN")) {
      document.body.innerHTML = "<h2>Access Denied</h2>";
      return;
    }

    localStorage.setItem('token', keycloak.token);

    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <App />
      </StrictMode>
    );

    setInterval(() => {
      keycloak.updateToken(60).then((refreshed) => {
        if (refreshed) {
          console.log("Token refreshed");
          localStorage.setItem('token', keycloak.token);
        }
      }).catch(() => {
        console.error("Failed to refresh token");
      });
    }, 30000);

  } else {
    console.error("User not authenticated");
  }

}).catch((error) => {
  console.error("Keycloak init failed", error);
});
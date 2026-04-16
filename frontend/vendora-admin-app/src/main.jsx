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

    // Store token
    localStorage.setItem('token', keycloak.token);

    // Render app
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <App />
      </StrictMode>
    );

    // Refresh token automatically
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
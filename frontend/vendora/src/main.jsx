import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import keycloak from './keycloak';
import './App.css';

keycloak.init({ onLoad: 'login-required' }).then((authenticated) => {
  if (authenticated) {
    // Store token for axios
    localStorage.setItem('token', keycloak.token);

    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    // Auto-refresh token before it expires
    setInterval(() => {
      keycloak.updateToken(60).then((refreshed) => {
        if (refreshed) {
          localStorage.setItem('token', keycloak.token);
        }
      });
    }, 30000);
  }
});
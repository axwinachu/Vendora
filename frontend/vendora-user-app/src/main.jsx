import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import keycloak from './keycloak';
import './App.css';
keycloak.init({ onLoad: 'login-required' }).then((authenticated) => {
  if (authenticated) {
    const role= keycloak.tokenParsed?.resource_access?.["vendora-user-app"]?.roles || []
    if(!role.includes("USER")){
      document.body.innerHTML="<h2>access denied</h2>"
      return;
    }
    localStorage.setItem('token', keycloak.token);
    ReactDOM.createRoot(document.getElementById('root')).render(
        <App />
    );
    setInterval(() => {
      keycloak.updateToken(60).then((refreshed) => {
        if (refreshed) {
          localStorage.setItem('token', keycloak.token);
        }
      });
    }, 30000);
  }
});
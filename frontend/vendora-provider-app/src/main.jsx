import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import keycloak from "./keycloak/keycloak.js";

const USER_APP_URL = "http://localhost:5173";

keycloak
  .init({
    onLoad: "login-required",
    checkLoginIframe: false,
  })
  .then((authenticated) => {
    if (!authenticated) {
      keycloak.login();
      return;
    }
    const realmRoles = keycloak.tokenParsed?.realm_access?.roles || [];
    const clientRoles =
      keycloak.tokenParsed?.resource_access?.["vendora-app"]?.roles || [];

    const roles = [...realmRoles, ...clientRoles];

    console.log("Roles:", roles);

    //PROVIDER access check
    if (!roles.includes("PROVIDER")) {
      //Redirect USER → user app
      if (roles.includes("USER")) {
        window.location.replace(USER_APP_URL);
      } else {
        document.body.innerHTML = "<h2>Access Denied</h2>";
      }
      return;
    }

    // ✅ Store token + user info
    localStorage.setItem("token", keycloak.token);
    localStorage.setItem(
      "user",
      JSON.stringify(keycloak.tokenParsed)
    );

    // ✅ Render app
    createRoot(document.getElementById("root")).render(
      <StrictMode>
        <App keycloak={keycloak} />
      </StrictMode>
    );

    // ✅ Token refresh
    setInterval(() => {
      keycloak
        .updateToken(60)
        .then((refreshed) => {
          if (refreshed) {
            console.log("Token refreshed");
            localStorage.setItem("token", keycloak.token);
          }
        })
        .catch(() => {
          console.log("Session expired → login again");
          keycloak.login();
        });
    }, 30000);
  })
  .catch((err) => {
    console.error("Keycloak init error:", err);
  });
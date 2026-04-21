import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import keycloak from "./keycloak/keycloak.js";

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

    // ✅ Correct client role extraction
    const roles =
      keycloak.tokenParsed?.resource_access?.["vendora-provider-app"]?.roles || [];

    console.log("Roles:", roles);

    // ✅ Role check
    if (!roles.includes("PROVIDER")) {
      document.body.innerHTML = "<h2>Access Denied</h2>";
      return;
    }

    // ✅ Store token
    localStorage.setItem("token", keycloak.token);

    // ✅ Render app
    createRoot(document.getElementById("root")).render(
      <App keycloak={keycloak} />
    );

    // ✅ Refresh token
    setInterval(() => {
      keycloak
        .updateToken(60)
        .then((refreshed) => {
          if (refreshed) {
            localStorage.setItem("token", keycloak.token);
          }
        })
        .catch(() => {
          keycloak.login();
        });
    }, 30000);
  })
  .catch((err) => {
    console.error("Keycloak init error:", err);
  });
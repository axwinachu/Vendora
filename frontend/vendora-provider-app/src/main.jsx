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

    const realmRoles  = keycloak.tokenParsed?.realm_access?.roles || [];
    const clientRoles = keycloak.tokenParsed?.resource_access?.["vendora-app"]?.roles || [];
    const roles       = [...realmRoles, ...clientRoles];

    console.log("Roles:", roles);

    // PROVIDER access check
    if (!roles.includes("PROVIDER")) {
      if (roles.includes("USER")) {
        window.location.replace(USER_APP_URL);
      } else {
        document.body.innerHTML = "<h2>Access Denied</h2>";
      }
      return;
    }

    // ✅ Store token
    localStorage.setItem("token", keycloak.token);

    // ✅ Store user_profile in the shape the chat page expects:
    //    { id, userName, profilePhotoUrl }
    //
    //    Keycloak token fields:
    //      sub              → unique user id  (use as myId)
    //      preferred_username or email → display name
    //      picture          → avatar url (optional, not always present)
    const tp = keycloak.tokenParsed;
    const userProfile = {
      id:              tp.sub,                          // provider's unique ID
      userName:        tp.preferred_username || tp.email || tp.sub,
      profilePhotoUrl: tp.picture || null,
    };
    localStorage.setItem("user_profile", JSON.stringify(userProfile));

    console.log("Provider profile stored:", userProfile);

    // ✅ Render app
    createRoot(document.getElementById("root")).render(
      <StrictMode>
        <App keycloak={keycloak} />
      </StrictMode>
    );

    // ✅ Token refresh every 30s — also keeps user_profile in sync
    setInterval(() => {
      keycloak
        .updateToken(60)
        .then((refreshed) => {
          if (refreshed) {
            console.log("Token refreshed");
            localStorage.setItem("token", keycloak.token);
            // Refresh profile in case token fields changed
            const tp2 = keycloak.tokenParsed;
            localStorage.setItem("user_profile", JSON.stringify({
              id:              tp2.sub,
              userName:        tp2.preferred_username || tp2.email || tp2.sub,
              profilePhotoUrl: tp2.picture || null,
            }));
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
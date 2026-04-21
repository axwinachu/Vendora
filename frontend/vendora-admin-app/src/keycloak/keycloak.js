import Keycloak from "keycloak-js";

const keycloak=new Keycloak({
    url: "http://localhost:8080",
    realm: "vendora",
    clientId: "vendora-admin-app"

});

export default keycloak;
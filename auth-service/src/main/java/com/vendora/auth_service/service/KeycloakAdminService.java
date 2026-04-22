package com.vendora.auth_service.service;

import com.vendora.auth_service.config.KeycloakProperties;
import com.vendora.auth_service.dto.ChangeRoleRequest;
import com.vendora.auth_service.dto.RoleRequest;
import com.vendora.auth_service.dto.SearchRequest;
import com.vendora.auth_service.dto.UserRequest;
import com.vendora.auth_service.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakAdminService {

    private final WebClient webClient;
    private final KeycloakProperties props;

    // Allowlist of valid realm roles — single source of truth in the service layer
    private static final Set<String> VALID_REALM_ROLES = Set.of("ADMIN", "PROVIDER", "USER");

    private String cachedToken;
    private Instant tokenExpiry = Instant.MIN;

    // ─────────────────────────────────────────────────────────────────────────
    // Token management
    // ─────────────────────────────────────────────────────────────────────────

    public synchronized String getAdminToken() {
        if (cachedToken != null && Instant.now().isBefore(tokenExpiry)) {
            return cachedToken;
        }

        String url = props.getServerUrl() + "/realms/" + props.getRealm()
                + "/protocol/openid-connect/token";

        Map<?, ?> response = webClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue("grant_type=client_credentials"
                        + "&client_id="     + props.getClientId()
                        + "&client_secret=" + props.getClientSecret())
                .retrieve()
                .onStatus(s -> s.isError(), r -> r.bodyToMono(String.class)
                        .flatMap(body -> Mono.error(new RuntimeException(
                                "Token fetch failed: " + r.statusCode() + " — " + body))))
                .bodyToMono(Map.class)
                .blockOptional()
                .orElseThrow(() -> new RuntimeException("Token response was empty"));

        cachedToken = (String) response.get("access_token");
        Object raw = response.get("expires_in");
        int expiresIn = raw != null ? ((Number) raw).intValue() : 60;
        tokenExpiry = Instant.now().plusSeconds(expiresIn - 30);
        log.debug("Admin token refreshed, expires in {}s", expiresIn);
        return cachedToken;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Realm role operations  (NO client UUID needed — realm roles are global)
    // ─────────────────────────────────────────────────────────────────────────

    public void assignRole(RoleRequest req) {
        validateRole(req.getRole());

        String token = getAdminToken();
        Map<?, ?> role = fetchRealmRole(token, req.getRole());

        webClient.post()
                .uri(realmRoleMappingUri(req.getUserId()))
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(List.of(role))
                .retrieve()
                .onStatus(s -> s == HttpStatus.NOT_FOUND, r ->
                        Mono.error(new RuntimeException("User not found: " + req.getUserId())))
                .onStatus(s -> s.isError(), r -> r.bodyToMono(String.class)
                        .flatMap(body -> Mono.error(new RuntimeException(
                                "Assign role failed: " + r.statusCode() + " — " + body))))
                .toBodilessEntity()
                .block();

        log.info("Realm role '{}' assigned to user '{}'", req.getRole(), req.getUserId());
    }

    public void removeRole(RoleRequest req) {
        validateRole(req.getRole());

        String token = getAdminToken();
        Map<?, ?> role = fetchRealmRole(token, req.getRole());

        webClient.method(HttpMethod.DELETE)
                .uri(realmRoleMappingUri(req.getUserId()))
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(List.of(role))
                .retrieve()
                .onStatus(s -> s == HttpStatus.NOT_FOUND, r ->
                        Mono.error(new RuntimeException(
                                "User '" + req.getUserId() + "' not found or does not have role '" + req.getRole() + "'")))
                .onStatus(s -> s.isError(), r -> r.bodyToMono(String.class)
                        .flatMap(body -> Mono.error(new RuntimeException(
                                "Remove role failed: " + r.statusCode() + " — " + body))))
                .toBodilessEntity()
                .block();

        log.info("Realm role '{}' removed from user '{}'", req.getRole(), req.getUserId());
    }

    public void changeRole(ChangeRoleRequest req) {
        validateRole(req.getFromRole());
        validateRole(req.getToRole());

        if (req.getFromRole().equals(req.getToRole())) {
            throw new IllegalArgumentException("fromRole and toRole must be different");
        }

        String token = getAdminToken();
        Map<?, ?> oldRole = fetchRealmRole(token, req.getFromRole());
        Map<?, ?> newRole = fetchRealmRole(token, req.getToRole());
        String uri = realmRoleMappingUri(req.getUserId());

        // Delete old role first
        webClient.method(HttpMethod.DELETE)
                .uri(uri)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(List.of(oldRole))
                .retrieve()
                .onStatus(HttpStatus.NOT_FOUND::equals, r ->
                        Mono.error(new RuntimeException(
                                "User '" + req.getUserId() + "' does not have role '" + req.getFromRole() + "'")))
                .onStatus(s -> s.isError(), r -> r.bodyToMono(String.class)
                        .flatMap(body -> Mono.error(new RuntimeException(
                                "Remove old role failed: " + r.statusCode() + " — " + body))))
                .toBodilessEntity()
                .block();

        // Assign new role
        webClient.post()
                .uri(uri)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(List.of(newRole))
                .retrieve()
                .onStatus(s -> s.isError(), r -> r.bodyToMono(String.class)
                        .flatMap(body -> Mono.error(new RuntimeException(
                                "Assign new role failed: " + r.statusCode() + " — " + body))))
                .toBodilessEntity()
                .block();

        log.info("Realm role changed '{}' → '{}' for user '{}'",
                req.getFromRole(), req.getToRole(), req.getUserId());
    }

    public List<Map<?, ?>> getUserRoles(String userId) {
        String token = getAdminToken();

        List<?> roles = webClient.get()
                .uri(realmRoleMappingUri(userId))
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .onStatus(s -> s == HttpStatus.NOT_FOUND, r ->
                        Mono.error(new RuntimeException("User not found: " + userId)))
                .bodyToMono(List.class)
                .block();

        return roles == null ? List.of()
                : roles.stream().map(r -> (Map<?, ?>) r).collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // User CRUD
    // ─────────────────────────────────────────────────────────────────────────

    public List<UserResponse> listUsers(int first, int max) {
        String token = getAdminToken();
        List<?> raw = webClient.get()
                .uri(props.getServerUrl() + "/admin/realms/" + props.getRealm()
                        + "/users?first=" + first + "&max=" + max)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .bodyToMono(List.class)
                .block();
        return mapUsers(raw);
    }

    public List<UserResponse> searchUsers(SearchRequest req) {
        String token = getAdminToken();

        StringBuilder uri = new StringBuilder(
                props.getServerUrl() + "/admin/realms/" + props.getRealm() + "/users?");

        if (req.getUsername()  != null) uri.append("username=").append(req.getUsername()).append("&");
        if (req.getEmail()     != null) uri.append("email=").append(req.getEmail()).append("&");
        if (req.getFirstName() != null) uri.append("firstName=").append(req.getFirstName()).append("&");
        if (req.getLastName()  != null) uri.append("lastName=").append(req.getLastName()).append("&");
        uri.append("first=").append(req.getFirst()).append("&max=").append(req.getMax());

        List<?> raw = webClient.get()
                .uri(uri.toString())
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .bodyToMono(List.class)
                .block();
        return mapUsers(raw);
    }

    public String createUser(UserRequest req) {
        String token = getAdminToken();

        Map<String, Object> body = new HashMap<>();
        if (req.getUsername()  != null) body.put("username",  req.getUsername());
        if (req.getEmail()     != null) body.put("email",     req.getEmail());
        if (req.getFirstName() != null) body.put("firstName", req.getFirstName());
        if (req.getLastName()  != null) body.put("lastName",  req.getLastName());
        body.put("enabled", req.isEnabled());

        log.debug("Creating Keycloak user: {}", body);

        return webClient.post()
                .uri(props.getServerUrl() + "/admin/realms/" + props.getRealm() + "/users")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchangeToMono(response ->
                        response.bodyToMono(String.class)
                                .defaultIfEmpty("")
                                .flatMap(responseBody -> {
                                    log.info("Keycloak createUser → status: {}, body: {}",
                                            response.statusCode(), responseBody);

                                    if (response.statusCode().value() == 201) {
                                        String location = response.headers()
                                                .asHttpHeaders().getFirst("Location");
                                        if (location == null) {
                                            return Mono.error(new RuntimeException(
                                                    "User created but no Location header returned"));
                                        }
                                        return Mono.just(
                                                location.substring(location.lastIndexOf('/') + 1));
                                    }

                                    return Mono.error(new RuntimeException(
                                            "User creation failed — status: "
                                                    + response.statusCode()
                                                    + ", reason: " + responseBody));
                                })
                )
                .block();
    }

    public void deleteUser(String userId) {
        String token = getAdminToken();
        webClient.delete()
                .uri(props.getServerUrl() + "/admin/realms/" + props.getRealm()
                        + "/users/" + userId)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .onStatus(s -> s == HttpStatus.NOT_FOUND, r ->
                        Mono.error(new RuntimeException("User not found: " + userId)))
                .toBodilessEntity()
                .block();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Builds the realm-level role-mapping URI for a user.
     * Realm roles live at: /admin/realms/{realm}/users/{userId}/role-mappings/realm
     * NOT at /role-mappings/clients/{clientUUID} — that's for client roles.
     */
    private String realmRoleMappingUri(String userId) {
        return props.getServerUrl()
                + "/admin/realms/" + props.getRealm()
                + "/users/" + userId
                + "/role-mappings/realm";           // <── this is the key fix
    }

    /**
     * Fetches a realm role object by name.
     * Realm roles live at: /admin/realms/{realm}/roles/{roleName}
     * NOT at /clients/{clientUUID}/roles/{roleName}.
     */
    private Map<?, ?> fetchRealmRole(String token, String roleName) {
        return webClient.get()
                .uri(props.getServerUrl()
                        + "/admin/realms/" + props.getRealm()
                        + "/roles/" + roleName)     // <── realm roles endpoint
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .onStatus(s -> s == HttpStatus.NOT_FOUND, r ->
                        Mono.error(new RuntimeException(
                                "Realm role not found: '" + roleName
                                        + "'. Ensure the role exists in the '" + props.getRealm() + "' realm.")))
                .onStatus(s -> s.isError(), r -> r.bodyToMono(String.class)
                        .flatMap(body -> Mono.error(new RuntimeException(
                                "Fetch realm role failed: " + r.statusCode() + " — " + body))))
                .bodyToMono(Map.class)
                .block();
    }

    /**
     * Validates a role name against the allowlist before hitting Keycloak.
     * This prevents any garbage value from ever reaching the Keycloak API.
     */
    private void validateRole(String role) {
        if (!VALID_REALM_ROLES.contains(role)) {
            throw new IllegalArgumentException(
                    "Invalid role: '" + role + "'. Must be one of: " + VALID_REALM_ROLES);
        }
    }

    private List<UserResponse> mapUsers(List<?> raw) {
        if (raw == null) return List.of();
        return raw.stream().map(u -> {
            Map<?, ?> m = (Map<?, ?>) u;
            return new UserResponse(
                    (String) m.get("id"),
                    (String) m.get("username"),
                    (String) m.get("email"),
                    (String) m.get("firstName"),
                    (String) m.get("lastName"),
                    Boolean.TRUE.equals(m.get("enabled"))
            );
        }).collect(Collectors.toList());
    }
}
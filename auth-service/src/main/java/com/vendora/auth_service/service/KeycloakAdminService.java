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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakAdminService {

    private final WebClient webClient;
    private final KeycloakProperties props;

    // ─── Token cache ─────────────────────────────────────────────────────────
    private String cachedToken;
    private Instant tokenExpiry = Instant.MIN;

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
        return cachedToken;
    }

    // ─── Get Client UUID ──────────────────────────────────────────────────────
    public String getClientUUID(String token, String clientName) {
        List<?> clients = webClient.get()
                .uri(props.getServerUrl() + "/admin/realms/" + props.getRealm()
                        + "/clients?clientId=" + clientName)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .bodyToMono(List.class)
                .blockOptional()
                .orElseThrow(() -> new RuntimeException("Client not found: " + clientName));

        if (clients.isEmpty())
            throw new RuntimeException("Client not found: " + clientName);

        return ((Map<?, ?>) clients.get(0)).get("id").toString();
    }

    // ─── Assign role ──────────────────────────────────────────────────────────
    public void assignRole(RoleRequest req) {
        String token      = getAdminToken();
        String clientUUID = getClientUUID(token, req.getClient());
        Map<?, ?> role    = fetchRole(token, clientUUID, req.getRole());

        webClient.post()
                .uri(props.getServerUrl() + "/admin/realms/" + props.getRealm()
                        + "/users/" + req.getUserId() + "/role-mappings/clients/" + clientUUID)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(List.of(role))
                .retrieve()
                .toBodilessEntity()
                .block();
    }

    // ─── Remove role ──────────────────────────────────────────────────────────
    public void removeRole(RoleRequest req) {
        String token      = getAdminToken();
        String clientUUID = getClientUUID(token, req.getClient());
        Map<?, ?> role    = fetchRole(token, clientUUID, req.getRole());

        webClient.method(HttpMethod.DELETE)
                .uri(props.getServerUrl() + "/admin/realms/" + props.getRealm()
                        + "/users/" + req.getUserId() + "/role-mappings/clients/" + clientUUID)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(List.of(role))
                .retrieve()
                .toBodilessEntity()
                .block();
    }

    // ─── Change role (remove old → assign new) ────────────────────────────────
    public void changeRole(ChangeRoleRequest req) {
        String token = getAdminToken();

        // Resolve both client UUIDs up front — fail fast before mutating anything
        String fromClientUUID = getClientUUID(token, req.getFromClient());
        String toClientUUID   = getClientUUID(token, req.getToClient());

        Map<?, ?> oldRole = fetchRole(token, fromClientUUID, req.getFromRole());
        Map<?, ?> newRole = fetchRole(token, toClientUUID,   req.getToRole());

        String baseUrl = props.getServerUrl() + "/admin/realms/" + props.getRealm()
                + "/users/" + req.getUserId() + "/role-mappings/clients/";

        // Step 1: Remove old role
        webClient.method(HttpMethod.DELETE)
                .uri(baseUrl + fromClientUUID)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(List.of(oldRole))
                .retrieve()
                .onStatus(HttpStatus.NOT_FOUND::equals, r ->
                        Mono.error(new RuntimeException(
                                "User '" + req.getUserId() + "' does not have role '"
                                        + req.getFromRole() + "' on client '" + req.getFromClient() + "'")))
                .toBodilessEntity()
                .block();

        // Step 2: Assign new role
        webClient.post()
                .uri(baseUrl + toClientUUID)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(List.of(newRole))
                .retrieve()
                .toBodilessEntity()
                .block();
    }

    // ─── List users ───────────────────────────────────────────────────────────
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

    // ─── Search / filter users ────────────────────────────────────────────────
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

    // ─── Get user roles ───────────────────────────────────────────────────────
    public List<Map<?, ?>> getUserRoles(String userId, String clientName) {
        String token      = getAdminToken();
        String clientUUID = getClientUUID(token, clientName);

        List<?> roles = webClient.get()
                .uri(props.getServerUrl() + "/admin/realms/" + props.getRealm()
                        + "/users/" + userId + "/role-mappings/clients/" + clientUUID)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .bodyToMono(List.class)
                .block();

        return roles == null ? List.of()
                : roles.stream().map(r -> (Map<?, ?>) r).collect(Collectors.toList());
    }

    // ─── Create user ──────────────────────────────────────────────────────────
    public String createUser(UserRequest req) {
        String token = getAdminToken();

        Map<String, Object> body = new HashMap<>();
        if (req.getUsername()  != null) body.put("username",  req.getUsername());
        if (req.getEmail()     != null) body.put("email",     req.getEmail());
        if (req.getFirstName() != null) body.put("firstName", req.getFirstName());
        if (req.getLastName()  != null) body.put("lastName",  req.getLastName());
        body.put("enabled", req.isEnabled());

        log.debug("Creating Keycloak user with body: {}", body);

        return webClient.post()
                .uri(props.getServerUrl() + "/admin/realms/" + props.getRealm() + "/users")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchangeToMono(response ->
                        // Read body FIRST before doing anything else — stream can only be read once
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
                                        // Extract userId from: .../users/{userId}
                                        return Mono.just(
                                                location.substring(location.lastIndexOf('/') + 1));
                                    }

                                    // Non-201 → surface the exact Keycloak error
                                    return Mono.error(new RuntimeException(
                                            "User creation failed — status: "
                                                    + response.statusCode()
                                                    + ", reason: " + responseBody));
                                })
                )
                .block();
    }

    // ─── Delete user ──────────────────────────────────────────────────────────
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

    // ─── Helpers ──────────────────────────────────────────────────────────────
    private Map<?, ?> fetchRole(String token, String clientUUID, String roleName) {
        return webClient.get()
                .uri(props.getServerUrl() + "/admin/realms/" + props.getRealm()
                        + "/clients/" + clientUUID + "/roles/" + roleName)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .onStatus(s -> s == HttpStatus.NOT_FOUND, r ->
                        Mono.error(new RuntimeException("Role not found: " + roleName)))
                .bodyToMono(Map.class)
                .block();
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
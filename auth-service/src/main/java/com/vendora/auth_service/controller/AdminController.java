package com.vendora.auth_service.controller;

import com.vendora.auth_service.dto.ChangeRoleRequest;
import com.vendora.auth_service.dto.RoleRequest;
import com.vendora.auth_service.dto.SearchRequest;
import com.vendora.auth_service.dto.UserRequest;
import com.vendora.auth_service.dto.UserResponse;
import com.vendora.auth_service.facade.AdminFacade;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth/admin")
@RequiredArgsConstructor
@Validated
public class AdminController {

    private final AdminFacade adminFacade;

    // ── Role management ──────────────────────────────────────────────────────

    @PostMapping("/assign-role")
    public ResponseEntity<String> assignRole(@Valid @RequestBody RoleRequest req) {
        adminFacade.assignRole(req);
        return ResponseEntity.ok("Role '" + req.getRole() + "' assigned to user '" + req.getUserId() + "'");
    }

    @DeleteMapping("/remove-role")
    public ResponseEntity<String> removeRole(@Valid @RequestBody RoleRequest req) {
        adminFacade.removeRole(req);
        return ResponseEntity.ok("Role '" + req.getRole() + "' removed from user '" + req.getUserId() + "'");
    }

    @PatchMapping("/change-role")
    public ResponseEntity<String> changeRole(@Valid @RequestBody ChangeRoleRequest req) {
        adminFacade.changeRole(req);
        return ResponseEntity.ok(
                "Role changed from '" + req.getFromRole() + "' to '" + req.getToRole() + "' for user '" + req.getUserId() + "'");
    }

    // ── User queries ─────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> listUsers(
            @RequestParam(defaultValue = "0")  int first,
            @RequestParam(defaultValue = "20") int max) {
        return ResponseEntity.ok(adminFacade.listUsers(first, max));
    }

    @GetMapping("/users/search")
    public ResponseEntity<List<UserResponse>> searchUsers(@Valid SearchRequest req) {
        return ResponseEntity.ok(adminFacade.searchUsers(req));
    }

    /**
     * Returns the realm roles assigned to a user.
     * The 'client' query param has been removed — we use realm roles only.
     */
    @GetMapping("/users/{userId}/roles")
    public ResponseEntity<List<Map<?, ?>>> getUserRoles(@PathVariable String userId) {
        return ResponseEntity.ok(adminFacade.getUserRoles(userId));
    }

    // ── User CRUD ─────────────────────────────────────────────────────────────

    @PostMapping("/users")
    public ResponseEntity<String> createUser(@Valid @RequestBody UserRequest req) {
        String newId = adminFacade.createUser(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(newId);
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable String userId) {
        adminFacade.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }
}
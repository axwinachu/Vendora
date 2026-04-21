package com.vendora.auth_service.facade;

import com.vendora.auth_service.dto.ChangeRoleRequest;
import com.vendora.auth_service.dto.RoleRequest;
import com.vendora.auth_service.dto.SearchRequest;
import com.vendora.auth_service.dto.UserRequest;
import com.vendora.auth_service.dto.UserResponse;
import com.vendora.auth_service.service.KeycloakAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class AdminFacade {

    private final KeycloakAdminService keycloakService;

    public void assignRole(RoleRequest req)                 { keycloakService.assignRole(req); }
    public void removeRole(RoleRequest req)                 { keycloakService.removeRole(req); }
    public void changeRole(ChangeRoleRequest req)           { keycloakService.changeRole(req); }
    public List<UserResponse> listUsers(int first, int max) { return keycloakService.listUsers(first, max); }
    public List<UserResponse> searchUsers(SearchRequest req){ return keycloakService.searchUsers(req); }
    public List<Map<?,?>> getUserRoles(String uid, String client){ return keycloakService.getUserRoles(uid, client); }
    public String createUser(UserRequest req)               { return keycloakService.createUser(req); }
    public void deleteUser(String userId)                   { keycloakService.deleteUser(userId); }
}
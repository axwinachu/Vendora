package com.vendora.auth_service.dto;

import lombok.Data;

@Data
public class RoleRequest {
    private String userId;
    private String client;
    private String role;
}

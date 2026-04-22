package com.vendora.auth_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class RoleRequest {

    @NotBlank(message = "userId is required")
    private String userId;

    @NotBlank(message = "role is required")
    @Pattern(
            regexp = "^(ADMIN|PROVIDER|USER)$",
            message = "role must be one of: ADMIN, PROVIDER, USER"
    )
    private String role;
}
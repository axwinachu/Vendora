package com.vendora.auth_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ChangeRoleRequest {

    @NotBlank(message = "userId is required")
    private String userId;

    @NotBlank(message = "fromRole is required")
    @Pattern(
            regexp = "^(ADMIN|PROVIDER|USER)$",
            message = "fromRole must be one of: ADMIN, PROVIDER, USER"
    )
    private String fromRole;

    @NotBlank(message = "toRole is required")
    @Pattern(
            regexp = "^(ADMIN|PROVIDER|USER)$",
            message = "toRole must be one of: ADMIN, PROVIDER, USER"
    )
    private String toRole;
}
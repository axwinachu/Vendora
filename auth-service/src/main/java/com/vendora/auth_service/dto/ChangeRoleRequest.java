package com.vendora.auth_service.dto;

import lombok.Data;

@Data
public class ChangeRoleRequest {

    private String userId;

    private String fromClient;

    private String fromRole;

    private String toClient;

    private String toRole;
}

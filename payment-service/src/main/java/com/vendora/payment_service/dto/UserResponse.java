package com.vendora.payment_service.dto;

import lombok.Data;

@Data
public class UserResponse {
    private String id;
    private String name;
    private String email;
}
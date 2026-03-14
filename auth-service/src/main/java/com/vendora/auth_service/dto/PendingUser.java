package com.vendora.auth_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PendingUser {
    private String name;
    private String email;
    private String encodedPassword;
}

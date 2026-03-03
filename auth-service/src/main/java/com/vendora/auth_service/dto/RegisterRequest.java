package com.vendora.auth_service.dto;

import com.vendora.auth_service.enums.Role;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RegisterRequest {
    @Email
    private String email;

    @Min(value = 8,message = "enter a valid password")
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;
}

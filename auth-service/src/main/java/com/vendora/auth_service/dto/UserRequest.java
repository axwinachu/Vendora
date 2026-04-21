package com.vendora.auth_service.dto;

import jakarta.validation.Valid;
import lombok.Data;

@Data
public class UserRequest {
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    boolean enabled =true;

}

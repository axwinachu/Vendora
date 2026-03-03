package com.vendora.auth_service.facade;

import com.vendora.auth_service.dto.AuthResponse;
import com.vendora.auth_service.dto.LoginRequest;
import com.vendora.auth_service.dto.RegisterRequest;
import com.vendora.auth_service.service.AuthService;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthFacade {
    private final AuthService authService;

    public String signup(RegisterRequest request) {

    }

    public AuthResponse login(LoginRequest request) {

    }
}

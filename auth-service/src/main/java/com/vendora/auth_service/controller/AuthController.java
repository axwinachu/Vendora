package com.vendora.auth_service.controller;

import com.vendora.auth_service.dto.*;
import com.vendora.auth_service.facade.AuthFacade;
import com.vendora.auth_service.model.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthFacade authFacade;

    @PostMapping("/signup")
    public String signup(@Valid @RequestBody SignupRequest request){
        return authFacade.signup(request);
    }

    @PostMapping("/verify-otp")
    public String verifyOtp(@Valid @RequestBody OtpRequest request){
        authFacade.verifyOtp(request);
        return "verified successfully";
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request){
        return authFacade.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request){
        return authFacade.refresh(request);
    }

    @PostMapping("/logout")
    public void logout(@Valid @RequestBody RefreshRequest request){
        authFacade.logout(request);
    }

}

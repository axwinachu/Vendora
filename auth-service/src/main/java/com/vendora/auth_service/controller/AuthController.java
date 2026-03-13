package com.vendora.auth_service.controller;

import com.vendora.auth_service.dto.AuthResponse;
import com.vendora.auth_service.dto.LoginRequest;
import com.vendora.auth_service.dto.OtpRequest;
import com.vendora.auth_service.dto.SignupRequest;
import com.vendora.auth_service.facade.AuthFacade;
import com.vendora.auth_service.model.User;
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
    public String signup(@RequestBody SignupRequest signupRequest){
        return authFacade.signup(signupRequest);
    }

    @PostMapping("/verify-otp")
    public String verifyOtp(@RequestBody OtpRequest otpRequest){
        authFacade.verifyOtp(otpRequest);
        return "verified successfully";
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest loginRequest){
        return authFacade.login(loginRequest);
    }

}

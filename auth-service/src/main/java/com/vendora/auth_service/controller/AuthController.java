package com.vendora.auth_service.controller;


import com.vendora.auth_service.dto.AuthResponse;
import com.vendora.auth_service.dto.LoginRequest;
import com.vendora.auth_service.dto.RegisterRequest;
import com.vendora.auth_service.facade.AuthFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {
    private final AuthFacade authFacade;

    @PostMapping("/signup")
    public String signup(@RequestBody RegisterRequest request){
        return authFacade.signup(request);
    }
    public AuthResponse login(@RequestBody LoginRequest request){
        return authFacade.login(request);
    }

}

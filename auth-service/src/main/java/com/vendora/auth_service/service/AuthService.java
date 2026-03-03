package com.vendora.auth_service.service;

import com.vendora.auth_service.exception.EmailNotFound;
import com.vendora.auth_service.model.Credential;
import com.vendora.auth_service.repository.AuthRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthRepository authRepository;

    public  Credential findByEmail(String email){
        return authRepository.findByEmail(email).orElseThrow(()->new EmailNotFound("email id not found"));
    }
    public boolean existByEmail(String email){
        return authRepository.existSByEmail(email);
    }
}

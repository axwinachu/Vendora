package com.vendora.auth_service.service;

import com.vendora.auth_service.exception.UserNotFound;
import com.vendora.auth_service.model.User;
import com.vendora.auth_service.repository.AuthRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthRepository authRepository;
    public User findByEmail(String email){
        return authRepository.findByEmail(email)
                .orElseThrow(()->new UserNotFound("please enter a valid email address"));
    }

    public boolean existsByEmail(String email){
        return authRepository.existsByEmail(email);
    }
    public User saveUser(User user){
        return authRepository.save(user);
    }

    public void updateUser(User user){
        authRepository.save(user);
    }
}

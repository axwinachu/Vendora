package com.vendora.auth_service.facade;

import com.vendora.auth_service.dto.*;
import com.vendora.auth_service.enums.Role;
import com.vendora.auth_service.enums.Status;
import com.vendora.auth_service.exception.EmailNotVerifiedException;
import com.vendora.auth_service.model.User;
import com.vendora.auth_service.service.AuthService;
import com.vendora.auth_service.service.EmailService;
import com.vendora.auth_service.service.OtpService;
import com.vendora.auth_service.service.RefreshTokenService;
import com.vendora.auth_service.util.JWTUtil;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class AuthFacade {
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final EmailService emailService;
    private final OtpService otpService;
    private final JWTUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    @Transactional
    public String signup(SignupRequest request) {
        if(authService.existsByEmail(request.getEmail())){
            throw new RuntimeException("Email has already registered");
        }
        PendingUser pendingUser=new PendingUser(
                request.getName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword())
        );
        otpService.storePendingUser(pendingUser);
        String otp=otpService.generateOtp();

        otpService.storeOtp(request.getEmail(), otp);

        emailService.sendOtp(request.getEmail(), otp);

        return "OTP SENDED TO THE EMAIL"+request.getEmail();
    }
    public void verifyOtp(OtpRequest otpRequest){
        if(!otpService.validateOtp(otpRequest.getEmail(), otpRequest.getOtp())){
            throw new RuntimeException("INVALID OTP");
        }
        PendingUser pendingUser=otpService.getPendingUser(otpRequest.getEmail());
        User user=User.builder()
                .name(pendingUser.getName())
                .email(pendingUser.getEmail())
                .password(pendingUser.getEncodedPassword())
                .role(Role.CUSTOMER)
                .status(Status.ACTIVE)
                .emailVerified(true)
                .createdAt(LocalDateTime.now())
                .build();
        authService.saveUser(user);

        otpService.deleteOtp(otpRequest.getEmail());

    }

    public AuthResponse login(LoginRequest loginRequest){
        User user=authService.findByEmail(loginRequest.getEmail());
        if(!user.isEmailVerified()){
            throw new EmailNotVerifiedException("Email not verified");
        }
        if(!passwordEncoder.matches(loginRequest.getPassword(),user.getPassword())){
            throw new RuntimeException("INVALID");
        }
        String token= jwtUtil.generateToken(user.getId(), user.getEmail(),user.getRole().name());
        String refreshToken= jwtUtil.generateRefreshToken(user.getId(), user.getEmail());
        refreshTokenService.storeRefreshToken(user.getId(), refreshToken);
        return new AuthResponse(token,refreshToken);
    }

    public AuthResponse refresh(RefreshRequest request) {
        String inComingToken=request.getRefreshToken();
        Long userId;
        String email;
        try{
            userId = jwtUtil.getUserIdFromRefreshToken(inComingToken);
            email=jwtUtil.getEmailFromRefreshToken(inComingToken);
        }catch (Exception ex){
            throw new RuntimeException("INVALID EXPIRATION TOKEN");
        }
        if(!refreshTokenService.validateRefreshToken(userId,inComingToken)){
            throw new RuntimeException("Refresh Token Mismatch.please Longin again");
        }

        User user =authService.findByEmail(email);
        String newAccessToken=jwtUtil.generateToken(user.getId(),user.getEmail(),user.getRole().name());
        String newRefreshToken= jwtUtil.generateRefreshToken(user.getId(),user.getEmail());

        refreshTokenService.storeRefreshToken(user.getId(),newRefreshToken);
        return  new AuthResponse(newAccessToken,newRefreshToken);
    }

    public void logout(RefreshRequest request) {
        String incomingToken=request.getRefreshToken();
        Long userId;
        try {
            userId=jwtUtil.getUserIdFromRefreshToken(incomingToken);
        }catch (Exception ex){
            throw new RuntimeException("Invalid refresh token");
        }
        refreshTokenService.deleteRefreshToken(userId);
    }
}

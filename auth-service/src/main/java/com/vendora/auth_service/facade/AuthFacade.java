package com.vendora.auth_service.facade;

import com.vendora.auth_service.dto.AuthResponse;
import com.vendora.auth_service.dto.LoginRequest;
import com.vendora.auth_service.dto.OtpRequest;
import com.vendora.auth_service.dto.SignupRequest;
import com.vendora.auth_service.enums.Role;
import com.vendora.auth_service.enums.Status;
import com.vendora.auth_service.model.User;
import com.vendora.auth_service.service.AuthService;
import com.vendora.auth_service.service.EmailService;
import com.vendora.auth_service.service.OtpService;
import com.vendora.auth_service.util.JWTUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthFacade {
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final EmailService emailService;
    private final OtpService otpService;
    private final JWTUtil jwtUtil;
    @Transactional
    public String signup(SignupRequest signupRequest) {
        if(authService.existsByEmail(signupRequest.getEmail())){
            throw new RuntimeException("User has already registered");
        }
        User user= User.builder()
                .name(signupRequest.getName())
                .email(signupRequest.getEmail())
                .password(passwordEncoder.encode(signupRequest.getPassword()))
                .status(Status.ACTIVE)
                .role(Role.CUSTOMER)
                .emailVerified(false).build();
        authService.saveUser(user);

        String otp=otpService.generateOtp();

        otpService.storeOtp(user.getEmail(), otp);

        emailService.sendOtp(user.getEmail(), otp);

        return "OTP SENDED TO THE EMAIL"+user.getEmail();
    }
    public void verifyOtp(OtpRequest otpRequest){
        if(!otpService.validateOtp(otpRequest.getEmail(), otpRequest.getOtp())){
            throw new RuntimeException("INVALID OTP");
        }

        User user=authService.findByEmail(otpRequest.getEmail());

        user.setEmailVerified(true);

        authService.saveUser(user);

        otpService.deleteOtp(otpRequest.getEmail());
    }

    public AuthResponse login(LoginRequest loginRequest){
        User user=authService.findByEmail(loginRequest.getEmail());

        if(!passwordEncoder.matches(loginRequest.getPassword(),user.getPassword())){
            throw new RuntimeException("INVALID");
        }
        String token= jwtUtil.generateToken(user.getId(), user.getEmail(),user.getRole().name());

        return new AuthResponse(token);
    }
}

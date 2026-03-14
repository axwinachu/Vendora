package com.vendora.auth_service.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(DuplicateEmailException.class)
    public ErrorResponse handleDuplicate(DuplicateEmailException ex){
        return new ErrorResponse("DUPLICATE_EMAIL", ex.getMessage());
    }
    @ExceptionHandler(InvalidCredentialException.class)
    public ErrorResponse handleInvalidCredential(InvalidCredentialException ex){
        return new ErrorResponse("INVALID_CREDENTIAL",ex.getMessage());
    }
    @ExceptionHandler(EmailNotVerifiedException.class)
    public ErrorResponse handeUnVerified(EmailNotVerifiedException ex){
        return new ErrorResponse("EMAIL_NOT_VERIFIED",ex.getMessage());
    }
    @ExceptionHandler(OtpExpiredException.class)
    public ErrorResponse handelOtpExpired(OtpExpiredException ex){
        return new ErrorResponse("OTP_EXPIRED",ex.getMessage());
    }
    @ExceptionHandler(Exception.class)
    public ErrorResponse handleUnexpected(Exception ex){
        log.error("Un expected error",ex);
        return new ErrorResponse("INTERNAL_SERVER_ERROR","SOMETHING_WENT_WRONG");
    }
}

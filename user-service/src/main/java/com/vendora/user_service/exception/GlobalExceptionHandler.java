package com.vendora.user_service.exception;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(EmailAlreadyRegisterException.class)
    public ErrorResponse handleEmailAlreadyRegistered(Exception ex){
        return new ErrorResponse("400",ex.getMessage());
    }
    @ExceptionHandler(FileOprationException.class)
    public ErrorResponse handleFileOprationException(Exception ex){
        return new ErrorResponse("400",ex.getMessage());
    }
    @ExceptionHandler(ProfileUploadingException.class)
    public ErrorResponse handle(Exception ex){
        return new ErrorResponse("400",ex.getMessage());
    }
}

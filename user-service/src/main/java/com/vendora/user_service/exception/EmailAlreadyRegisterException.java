package com.vendora.user_service.exception;

public class EmailAlreadyRegisterException extends RuntimeException {
    public EmailAlreadyRegisterException(String message) {
        super(message);
    }
}

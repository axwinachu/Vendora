package com.example.provider_service.exception;

public class InvalidFileFormateException extends RuntimeException {
    public InvalidFileFormateException(String message) {
        super(message);
    }
}

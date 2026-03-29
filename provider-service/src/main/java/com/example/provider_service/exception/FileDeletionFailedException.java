package com.example.provider_service.exception;

public class FileDeletionFailedException extends RuntimeException {
    public FileDeletionFailedException(String message) {
        super(message);
    }
}

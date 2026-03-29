package com.example.provider_service.exception;

public class UploadingFailedException extends RuntimeException {
    public UploadingFailedException(String message) {
        super(message);
    }
}

package com.example.provider_service.exception;

public class ExceedImagesException extends RuntimeException {
    public ExceedImagesException(String message) {
        super(message);
    }
}

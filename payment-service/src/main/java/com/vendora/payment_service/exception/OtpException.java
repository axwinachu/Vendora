package com.vendora.payment_service.exception;

public class OtpException extends RuntimeException {
    public OtpException(String message) {
        super(message);
    }
}
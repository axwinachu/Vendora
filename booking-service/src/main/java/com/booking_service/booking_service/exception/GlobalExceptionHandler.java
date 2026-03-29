package com.booking_service.booking_service.exception;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BookingNotFoundException.class)
    public ErrorResponse handleBookingNotFound(BookingNotFoundException ex){
        return new ErrorResponse("401",ex.getMessage());
    }
    @ExceptionHandler(InvalidBookingStatusException.class)
    public ErrorResponse handleInvalidBookingStatus(InvalidBookingStatusException ex){
        return new ErrorResponse("401",ex.getMessage());
    }
}

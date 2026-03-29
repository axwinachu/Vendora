package com.booking_service.booking_service.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorResponse {
    private String code;
    private String message;
    private LocalDateTime time;
    public ErrorResponse(String code,String message){
        this.code=code;
        this.message=message;
        this.time=LocalDateTime.now();
    }
}

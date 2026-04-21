package com.vendora.auth_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
@Builder
public class ApiErrorResponse {
    private int status;
    private String error;
    private String message;
    Instant timeStamp;
}

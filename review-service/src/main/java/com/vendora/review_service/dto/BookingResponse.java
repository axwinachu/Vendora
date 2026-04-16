package com.vendora.review_service.dto;

import lombok.Data;

@Data
public class BookingResponse {
    private String id;
    private String customerId;
    private String providerId;
    private String status;
}

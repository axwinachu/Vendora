package com.vendora.payment_service.dto;

import lombok.Data;

@Data
public class BookingResponse {
    private String id;

    private String status;

    private Double basePrice;
}

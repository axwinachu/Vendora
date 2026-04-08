package com.vendora.payment_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BookingCompletedEvent {
    private String bookingId;
    private String customerId;
    private String providerId;
    private String eventType;
    private Double basePrice;
    private String serviceCategory;
    private String scheduledDate;
    private String scheduledTime;
}
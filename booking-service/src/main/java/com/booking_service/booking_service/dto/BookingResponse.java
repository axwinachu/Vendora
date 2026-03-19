package com.booking_service.booking_service.dto;

import com.booking_service.booking_service.enums.BookingStatus;
import com.booking_service.booking_service.enums.ServiceCategory;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BookingResponse {
    private String id;
    private String customerId;
    private String providerId;
    private ServiceCategory serviceCategory;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate scheduledDate;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime scheduledTime;

    private String address;
    private String notes;
    private Double basePrice;
    private BookingStatus status;
    private String cancelledBy;
    private String cancellationReason;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}

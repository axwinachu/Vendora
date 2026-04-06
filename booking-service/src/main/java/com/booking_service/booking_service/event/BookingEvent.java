package com.booking_service.booking_service.event;

import com.booking_service.booking_service.enums.BookingStatus;
import com.booking_service.booking_service.enums.ServiceCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BookingEvent {
    private String bookingId;
    private String customerId;
    private String customerName;
    private String customerEmail;
    private String providerId;
    private String providerName;
    private String providerEmail;
    private BookingStatus status;
    private ServiceCategory serviceCategory;
    private LocalDate scheduledDate;
    private LocalTime scheduledTime;
    private String eventType;
    private String address;
    private String cancellationDetails;
}

package com.vendora.notification_service.event;

import com.vendora.notification_service.enums.BookingStatus;
import com.vendora.notification_service.enums.ServiceCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingEvent {
    private String bookingId;
    private String eventType;
    private String customerId;
    private String customerEmail;
    private String customerName;
    private String providerId;
    private String providerEmail;
    private String providerName;
    private BookingStatus status;
    private ServiceCategory serviceCategory;
    private LocalDate scheduledDate;
    private LocalTime scheduledTime;
    private String address;
    private String cancellationReason;

}

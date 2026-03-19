package com.booking_service.booking_service.event;

import com.booking_service.booking_service.enums.BookingStatus;
import com.booking_service.booking_service.enums.ServiceCategory;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BookingEvent {
    private String bookingId;
    private String customerId;
    private String providerId;
    private BookingStatus status;
    private ServiceCategory serviceCategory;
    private LocalDate scheduledDate;
    private LocalTime scheduledTime;
    private String eventType;
}

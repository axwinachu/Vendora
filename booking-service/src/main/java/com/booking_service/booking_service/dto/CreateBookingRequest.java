package com.booking_service.booking_service.dto;

import com.booking_service.booking_service.enums.ServiceCategory;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateBookingRequest {

    private String providerId;

    @NotNull(message = "Service category is required")
    private ServiceCategory serviceCategory;

    @NotNull(message = "Scheduled date is required")
    @Future(message = "Scheduled date must be in the future")
    private LocalDate scheduledDate;

    @NotNull(message = "Scheduled time is required")
    private LocalTime scheduledTime;

    @NotBlank(message = "Address is required")
    private String address;

    private String notes;
}

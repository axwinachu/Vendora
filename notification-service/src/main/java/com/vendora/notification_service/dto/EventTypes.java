package com.vendora.notification_service.dto;

public class EventTypes {

    public static final String BOOKING_CREATED = "booking.created";
    public static final String BOOKING_CONFIRMED = "booking.confirmed";
    public static final String BOOKING_CANCELLED = "booking.cancelled";
    public static final String BOOKING_COMPLETED = "booking.completed";
    public static final String BOOKING_OTP_GENERATED = "booking.otp.generated";
    public static final String BOOKING_REJECTED = "booking.rejected";

    private EventTypes() {} // prevent object creation
}
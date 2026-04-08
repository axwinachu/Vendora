package com.vendora.notification_service.template;

import com.vendora.notification_service.event.BookingEvent;

public class EmailTemplates {

    public static String subject(BookingEvent e) {
        return switch (e.getEventType()) {
            case "booking.created"   -> "Booking Request Received – #" + shortId(e.getBookingId());
            case "booking.confirmed" -> "Your Booking is Confirmed – #" + shortId(e.getBookingId());
            case "booking.rejected"  -> "Booking Request Declined – #" + shortId(e.getBookingId());
            case "booking.completed" -> "Service Completed – #" + shortId(e.getBookingId());
            case "booking.cancelled" -> "Booking Cancelled – #" + shortId(e.getBookingId());
            default -> "Booking Update – #" + shortId(e.getBookingId());
        };
    }

    public static String customerBody(BookingEvent e) {
        return switch (e.getEventType()) {
            case "booking.created" -> """
                Hi %s,

                Your booking request has been submitted.

                  Service  : %s
                  Provider : %s
                  Date     : %s at %s
                  Address  : %s

                We'll notify you once the provider confirms.

                Thanks, BookingApp
                """.formatted(e.getCustomerName(), e.getServiceCategory(),
                    e.getProviderName(), e.getScheduledDate(),
                    e.getScheduledTime(), e.getAddress());

            case "booking.confirmed" -> """
                Hi %s,

                %s has confirmed your booking!

                  Service  : %s
                  Date     : %s at %s
                  Address  : %s

                Thanks, BookingApp
                """.formatted(e.getCustomerName(), e.getProviderName(),
                    e.getServiceCategory(), e.getScheduledDate(),
                    e.getScheduledTime(), e.getAddress());

            case "booking.rejected" -> """
                Hi %s,

                Unfortunately %s could not accept your request.

                  Service  : %s
                  Date     : %s at %s

                Please try another provider.

                Thanks, BookingApp
                """.formatted(e.getCustomerName(), e.getProviderName(),
                    e.getServiceCategory(), e.getScheduledDate(), e.getScheduledTime());

            case "booking.completed" -> """
                Hi %s,

                Your service has been completed!

                  Service  : %s
                  Provider : %s

                Payment will be processed shortly.

                Thanks, BookingApp
                """.formatted(e.getCustomerName(),
                    e.getServiceCategory(), e.getProviderName());

            case "booking.cancelled" -> """
                Hi %s,

                Your booking has been cancelled.

                  Service  : %s
                  Date     : %s at %s
                  Reason   : %s

                Thanks, BookingApp
                """.formatted(e.getCustomerName(), e.getServiceCategory(),
                    e.getScheduledDate(), e.getScheduledTime(), reason(e));

            default -> "Your booking status updated to: " + e.getStatus();
        };
    }

    public static String providerBody(BookingEvent e) {
        return switch (e.getEventType()) {
            case "booking.created" -> """
                Hi %s,

                New booking request from %s.

                  Service  : %s
                  Date     : %s at %s
                  Address  : %s

                Please log in to confirm or reject.

                Thanks, BookingApp
                """.formatted(e.getProviderName(), e.getCustomerName(),
                    e.getServiceCategory(), e.getScheduledDate(),
                    e.getScheduledTime(), e.getAddress());

            case "booking.completed" -> """
                Hi %s,

                You completed the service for %s.

                  Service  : %s

                Payment will be settled once confirmed.

                Thanks, BookingApp
                """.formatted(e.getProviderName(),
                    e.getCustomerName(), e.getServiceCategory());

            case "booking.cancelled" -> """
                Hi %s,

                Booking from %s has been cancelled.

                  Service  : %s
                  Date     : %s at %s
                  Reason   : %s

                Thanks, BookingApp
                """.formatted(e.getProviderName(), e.getCustomerName(),
                    e.getServiceCategory(), e.getScheduledDate(),
                    e.getScheduledTime(), reason(e));

            // confirmed + rejected: provider took the action, no email needed
            default -> null;
        };
    }

    private static String reason(BookingEvent e) {
        return (e.getCancellationReason() != null && !e.getCancellationReason().isBlank())
                ? e.getCancellationReason() : "Not specified";
    }

    private static String shortId(String id) {
        return id != null && id.length() > 8 ? "..." + id.substring(id.length() - 8) : id;
    }
}

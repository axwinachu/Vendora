package com.vendora.payment_service.kafka;

import com.vendora.payment_service.dto.BookingCompletedEvent;
import com.vendora.payment_service.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingEventConsumer {

    private final PaymentService paymentService;

    @KafkaListener(
            topics = "booking.completed",
            groupId = "payment-service-group"
    )
    public void onBookingCompleted(BookingCompletedEvent event) {
        log.info("Received booking.completed event for bookingId={}",
                event.getBookingId());
        try {
            paymentService.handleBookingCompleted(event);
        } catch (Exception ex) {
            log.error("Error processing booking.completed for {}: {}",
                    event.getBookingId(), ex.getMessage());
        }
    }
}
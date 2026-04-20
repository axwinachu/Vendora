package com.booking_service.booking_service.service;

import com.booking_service.booking_service.event.BookingEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaProducerService {

    private final KafkaTemplate<String, BookingEvent> kafkaTemplate;

    private void publish(String topic, BookingEvent event) {
        kafkaTemplate.send(topic, event.getBookingId(), event);
        // FIX: Was logging `event` (full object dump) instead of event.getBookingId()
        log.info("Published [{}] event for booking {}", topic, event.getBookingId());
    }

    public void publishBookingCreated(BookingEvent event) {
        publish("booking.created", event);
    }

    public void publishBookingConfirmed(BookingEvent event) {
        publish("booking.confirmed", event);
    }

    public void publishBookingCancelled(BookingEvent event) {
        publish("booking.cancelled", event);
    }

    public void publishBookingCompleted(BookingEvent event) {
        publish("booking.completed", event);
    }
}
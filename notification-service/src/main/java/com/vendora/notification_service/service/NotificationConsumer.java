package com.vendora.notification_service.service;

import com.vendora.notification_service.event.BookingEvent;
import com.vendora.notification_service.template.EmailTemplates;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
@Slf4j
public class NotificationConsumer {

    private final EmailService emailService;

    @KafkaListener(
            topics = {"booking.created", "booking.confirmed", "booking.cancelled",
                    "booking.completed", "booking.rejected"},
            groupId = "notification-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleNotification(BookingEvent event) {
        log.info("Notification received → type={} bookingId={}",
                event.getEventType(), event.getBookingId());

        String subject = EmailTemplates.subject(event);

        // customer always gets an email
        String customerBody = EmailTemplates.customerBody(event);
        if (hasEmail(event.getCustomerEmail())) {
            emailService.send(event.getCustomerEmail(), subject, customerBody);
        }

        // provider only gets email for created, completed, cancelled
        String providerBody = EmailTemplates.providerBody(event);
        if (providerBody != null && hasEmail(event.getProviderEmail())) {
            emailService.send(event.getProviderEmail(), subject, providerBody);
        }
    }

    private boolean hasEmail(String email) {
        return email != null && !email.isBlank();
    }
}

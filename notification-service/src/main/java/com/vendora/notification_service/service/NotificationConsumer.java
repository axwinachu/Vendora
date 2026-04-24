package com.vendora.notification_service.service;


import com.vendora.notification_service.dto.EventTypes;
import com.vendora.notification_service.event.BookingEvent;
import com.vendora.notification_service.template.EmailTemplates;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationConsumer {

    private final EmailService emailService;

    @KafkaListener(
            topics = {
                    "booking.created",
                    "booking.confirmed",
                    "booking.cancelled",
                    "booking.completed",
                    "booking.rejected",
                    "booking.otp.generated"
            },
            groupId = "notification-group"
    )
    public void consume(BookingEvent event) {

        String type = event.getEventType();

        log.info("Event received → {}", type);

        if (type == null) {
            log.warn("Event type is null");
            return;
        }

        // 🔥 OTP CASE
        if (type.equals(EventTypes.BOOKING_OTP_GENERATED)) {

            if (hasEmail(event.getCustomerEmail())) {
                emailService.sendOtp(
                        event.getCustomerEmail(),
                        event.getOtp()
                );
            }
            return;
        }

        // 🔥 NORMAL EVENTS
        if (type.equals(EventTypes.BOOKING_CREATED)
                || type.equals(EventTypes.BOOKING_CONFIRMED)
                || type.equals(EventTypes.BOOKING_COMPLETED)
                || type.equals(EventTypes.BOOKING_CANCELLED)
                || type.equals(EventTypes.BOOKING_REJECTED)) {

            String subject = EmailTemplates.subject(event);

            if (hasEmail(event.getCustomerEmail())) {
                emailService.send(
                        event.getCustomerEmail(),
                        subject,
                        EmailTemplates.customerBody(event)
                );
            }

            String providerBody = EmailTemplates.providerBody(event);

            if (providerBody != null && hasEmail(event.getProviderEmail())) {
                emailService.send(
                        event.getProviderEmail(),
                        subject,
                        providerBody
                );
            }
        }
    }

    private boolean hasEmail(String email) {
        return email != null && !email.isBlank();
    }
}
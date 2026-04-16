package com.example.provider_service.kafka;

import com.example.provider_service.dto.ReviewCreatedEvent;
import com.example.provider_service.service.ProviderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReviewEventListener {

    private final ProviderService providerService;
    @KafkaListener(
            topics = "review-created",
            groupId = "provider-group"
    )
    public void handleReviewCreated(ReviewCreatedEvent event){
        log.info("review event recived for provider {} ,rating {} ",event.getProviderId(),event.getRating());
        try {
            providerService.updateRating(event.getProviderId(),event.getRating());
        }catch (Exception ex){
            log.error("failed to update rating for provider {}:{}",event.getProviderId(),event.getRating());
        }
    }
}

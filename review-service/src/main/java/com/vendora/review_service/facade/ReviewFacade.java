package com.vendora.review_service.facade;

import com.vendora.review_service.config.KafkaConfig;
import com.vendora.review_service.dto.BookingResponse;
import com.vendora.review_service.dto.CreateReviewRequest;
import com.vendora.review_service.dto.ReviewCreatedEvent;
import com.vendora.review_service.feign.BookingClient;
import com.vendora.review_service.model.Review;
import com.vendora.review_service.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ReviewFacade {
    private final ReviewService reviewService;
    private final BookingClient bookingClient;
    private final KafkaTemplate<String, ReviewCreatedEvent> kafkaTemplate;
    public Review createReview(String customerId, @Valid CreateReviewRequest request) {

        if(reviewService.findByBookingId(request.getBookingId()).isPresent()){
            throw new RuntimeException("Review already exist for the booking");
        }

        BookingResponse bookingResponse=bookingClient.getBookingById(request.getBookingId());

        if(!bookingResponse.getCustomerId().equals(customerId)){
            throw new RuntimeException("Unauthorized review");
        }
        if(!bookingResponse.getStatus().equals("PAID")){
            throw new RuntimeException("Would no give the review until the payment is completed");
        }
        Review saved= reviewService.save(Review.builder()
                .customerId(customerId)
                .providerId(bookingResponse.getProviderId())
                .bookingId(request.getBookingId())
                .rating(request.getRating())
                .comment(request.getComment()).build());
        kafkaTemplate.send(KafkaConfig.REVIEW_TOPIC,saved.getProviderId(),new ReviewCreatedEvent(saved.getProviderId(),saved.getRating()));
        return saved;


    }

    public List<Review> getProviderReviews(String providerId) {
        return reviewService.findByProviderId(providerId);
    }

    public Double getAverageRating(String providerId) {
        return reviewService.findByProviderId(providerId)
                .stream().mapToInt(Review::getRating)
                .average().orElse(0.0);
    }
}

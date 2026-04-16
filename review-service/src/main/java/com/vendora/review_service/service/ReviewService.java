package com.vendora.review_service.service;

import com.vendora.review_service.dto.CreateReviewRequest;
import com.vendora.review_service.model.Review;
import com.vendora.review_service.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository repository;

    public Review save(Review review){
        return repository.save(review);
    }

    public List<Review> findByProviderId(String providerId){
        return repository.findByProviderId(providerId);
    }

    public Optional<Review> findByBookingId(String bookingId){
        return repository.findByBookingId(bookingId);
    }
}

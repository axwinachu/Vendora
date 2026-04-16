package com.vendora.review_service.controller;

import com.vendora.review_service.dto.CreateReviewRequest;
import com.vendora.review_service.facade.ReviewFacade;
import com.vendora.review_service.model.Review;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/review")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewFacade reviewFacade;
    @PostMapping("/add")
    public Review createReview(@RequestHeader("X-User-Id") String customerId, @RequestBody @Valid CreateReviewRequest request){
        return reviewFacade.createReview(customerId,request);
    }
    @GetMapping("/provider/{providerId}")
    public List<Review> getReviews(@PathVariable String providerId){
        return reviewFacade.getProviderReviews(providerId);
    }
    @GetMapping("/provider/{providerId}/average")
    public Double getAverage(@PathVariable String providerId){
        return reviewFacade.getAverageRating(providerId);
    }
}

package com.vendora.review_service.repository;

import com.vendora.review_service.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review,String> {
    List<Review> findByProviderId(String providerId);
    Optional<Review> findByBookingId(String bookingId);
}

package com.example.provider_service.model;

import com.example.provider_service.enums.District;
import com.example.provider_service.enums.ProviderStatus;
import com.example.provider_service.enums.ServiceCategory;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Table(name = "providers")
public class Provider {
    @Id
    @Column(nullable = false,unique = true)
    private String userId;

    private String businessName;

    private String email;

    private String description;

    @Enumerated(EnumType.STRING)
    private ServiceCategory serviceCategory;

    @Enumerated(EnumType.STRING)
    private District district;

    @Column( length = 200)
    private String address;


    private Double latitude;

    private Double longitude;

    @Column(name = "profile_photo_url", length = 500)
    private String profilePhotoUrl;

    // stored as comma-separated URLs
    @Column(name = "portfolio_images", columnDefinition = "TEXT")
    private String portfolioImages;

    @Column(name = "experience_years")
    @Builder.Default
    private Integer experienceYears = 0;

    @Column(name = "base_price")
    private Double basePrice;

    @Column(name = "price_unit", length = 20)
    private String priceUnit;

    @Column(name = "average_rating")
    @Builder.Default
    private Double averageRating = 0.0;

    @Column(name = "total_reviews")
    @Builder.Default
    private Integer totalReviews = 0;

    @Column(name = "total_bookings")
    @Builder.Default
    private Integer totalBookings = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ProviderStatus status = ProviderStatus.PENDING;

    @Column(name = "is_available")
    @Builder.Default
    private Boolean isAvailable = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

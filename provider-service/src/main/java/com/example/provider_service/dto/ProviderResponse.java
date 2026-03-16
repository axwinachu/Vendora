package com.example.provider_service.dto;

import com.example.provider_service.enums.District;
import com.example.provider_service.enums.ProviderStatus;
import com.example.provider_service.enums.ServiceCategory;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProviderResponse {
    private String id;
    private String userId;
    private String businessName;
    private String description;
    private ServiceCategory serviceCategory;
    private District district;
    private String address;
    private Double latitude;
    private Double longitude;
    private String profilePhotoUrl;
    private List<String> portfolioImages;
    private Integer experienceYears;
    private Double basePrice;
    private String priceUnit;
    private Double averageRating;
    private Integer totalReviews;
    private Integer totalBookings;
    private ProviderStatus status;
    private Boolean isAvailable;
    private Double distanceKm;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}
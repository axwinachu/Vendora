package com.example.provider_service.mapper;

import com.example.provider_service.dto.ProviderResponse;
import com.example.provider_service.model.Provider;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Component
public class ProviderMapper {
    public ProviderResponse toResponse(Provider provider) {
        return toResponse(provider, null);
    }

    public ProviderResponse toResponse(Provider provider, Double distanceKm) {
        return ProviderResponse.builder()
                .userId(provider.getUserId())
                .businessName(provider.getBusinessName())
                .description(provider.getDescription())
                .serviceCategory(provider.getServiceCategory())
                .district(provider.getDistrict())
                .address(provider.getAddress())
                .latitude(provider.getLatitude())
                .longitude(provider.getLongitude())
                .profilePhotoUrl(provider.getProfilePhotoUrl())
                .portfolioImages(parsePortfolioImages(provider.getPortfolioImages()))
                .experienceYears(provider.getExperienceYears())
                .basePrice(provider.getBasePrice())
                .priceUnit(provider.getPriceUnit())
                .averageRating(provider.getAverageRating())
                .totalReviews(provider.getTotalReviews())
                .totalBookings(provider.getTotalBookings())
                .status(provider.getStatus())
                .isAvailable(provider.getIsAvailable())
                .distanceKm(distanceKm)
                .createdAt(provider.getCreatedAt())
                .updatedAt(provider.getUpdatedAt())
                .build();
    }

    private List<String> parsePortfolioImages(String portfolioImages) {
        if (portfolioImages == null || portfolioImages.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.asList(portfolioImages.split(","));
    }

}

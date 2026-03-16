package com.example.provider_service.dto;

import com.example.provider_service.enums.District;
import com.example.provider_service.enums.ServiceCategory;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateProviderRequest {
    @NotBlank(message = "User ID is required")
    private String userId;

    @NotBlank(message = "Business name is required")
    @Size(min = 2, max = 100, message = "Business name must be between 2 and 100 characters")
    private String businessName;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotNull(message = "Service category is required")
    private ServiceCategory serviceCategory;

    @NotNull(message = "District is required")
    private District district;

    @NotBlank(message = "Address is required")
    private String address;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0",  message = "Invalid latitude")
    @DecimalMax(value = "90.0",   message = "Invalid latitude")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Invalid longitude")
    @DecimalMax(value = "180.0",  message = "Invalid longitude")
    private Double longitude;

    @Min(value = 0, message = "Experience years must be 0 or more")
    private Integer experienceYears;

    @DecimalMin(value = "0.0", message = "Base price must be positive")
    private Double basePrice;

    private String priceUnit;

    private Boolean isAvailable;
}

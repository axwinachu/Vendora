package com.example.provider_service.dto;

import com.example.provider_service.enums.District;
import com.example.provider_service.enums.ServiceCategory;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UpdateProviderRequest {

    @Size(min = 2, max = 100)
    private String businessName;

    @Size(max = 500)
    private String description;

    private ServiceCategory serviceCategory;

    private District district;

    private String address;

    @DecimalMin(value = "-90.0")
    @DecimalMax(value = "90.0")
    private Double latitude;

    @DecimalMin(value = "-180.0")
    @DecimalMax(value = "180.0")
    private Double longitude;

    @Min(0)
    private Integer experienceYears;

    @DecimalMin(value = "0.0")
    private Double basePrice;

    private String priceUnit;

    private Boolean isAvailable;
}
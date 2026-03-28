package com.booking_service.booking_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProviderResponse {
    private String userId;
    private String businessName;
    private Boolean isAvailable;
    private Double basePrice;
    private String status;
}

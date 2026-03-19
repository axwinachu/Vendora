package com.booking_service.booking_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.el.parser.BooleanNode;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProviderResponse {
    private String id;
    private String businessName;
    private Boolean isAvailable;
    private Double basePrice;
    private String status;
}

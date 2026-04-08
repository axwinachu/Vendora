package com.vendora.payment_service.dto;

import lombok.Data;

@Data
public class ProviderResponse {
    private String  id;
    private String  userId;
    private String  businessName;
    private Double  basePrice;
    private String  status;
    private Boolean isAvailable;
    // Bank details for payout
    private String  accountNumber;
    private String  ifscCode;
    private String  accountHolderName;
}
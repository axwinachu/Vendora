package com.vendora.chat_service.dto;

import lombok.Data;

@Data
public class ProviderResponse {
    private String userId;
    private String businessName;
    private String profilePhotoUrl;
}
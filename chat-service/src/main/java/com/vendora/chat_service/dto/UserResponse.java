package com.vendora.chat_service.dto;

import lombok.Data;

@Data
public class UserResponse {
    private String userId;
    private String userName;
    private String profilePhotoUrl;

}

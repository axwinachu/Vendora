package com.vendora.chat_service.dto;

import lombok.Data;

@Data
public class ChatMessageDTO {

    private String userId;
    private String providerId;

    private String senderId;
    private String receiverId;

    private String content;
}
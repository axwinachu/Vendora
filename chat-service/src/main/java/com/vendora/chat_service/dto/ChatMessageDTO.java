package com.vendora.chat_service.dto;

import lombok.Data;

@Data
public class ChatMessageDTO {

    // Room identity — identifies which chat room this message belongs to
    private String userId;
    private String providerId;

    // Message routing — who is sending and who should receive this message
    private String senderId;
    private String receiverId;

    private String content;
}
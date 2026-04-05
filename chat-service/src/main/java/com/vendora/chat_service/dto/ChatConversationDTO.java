package com.vendora.chat_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ChatConversationDTO {

    private String peerId;
    private String peerName;
    private String lastMessage;
    private LocalDateTime lastTimestamp;
}
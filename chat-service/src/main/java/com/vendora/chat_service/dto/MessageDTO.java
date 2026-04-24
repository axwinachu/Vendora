package com.vendora.chat_service.dto;

import com.vendora.chat_service.model.Message;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Response DTO for persisted messages.
 * Never return the raw Message entity over HTTP — it exposes chatRoomId (internal DB key)
 * and any future sensitive fields. This DTO controls exactly what the client sees.
 */
@Data
@Builder
public class MessageDTO {

    private Long id;
    private String clientId;      // echoed back for frontend deduplication
    private String senderId;
    private String receiverId;
    private String content;
    private LocalDateTime timestamp;

    public static MessageDTO from(Message msg) {
        return MessageDTO.builder()
                .id(msg.getId())
                .clientId(msg.getClientId())
                .senderId(msg.getSenderId())
                .receiverId(msg.getReceiverId())
                .content(msg.getContent())
                .timestamp(msg.getTimestamp())
                .build();
    }
}
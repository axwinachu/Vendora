package com.vendora.chat_service.dto;

import lombok.Data;

@Data
public class ChatMessageDTO {

    // clientId: frontend-generated UUID for optimistic UI deduplication.
    // Not persisted, echoed back in the response so frontend can match
    // its pending message bubble to the confirmed server message.
    private String clientId;

    // Room identity — which conversation this belongs to

    private String userId;

    private String providerId;

    // DO NOT trust senderId from the client payload.
    // It is overwritten in ChatFacade using the authenticated WebSocket Principal.
    // This field is kept for the DTO structure but ignored server-side.
    private String senderId;

    // receiverId is still taken from the payload — sender knows who they are writing to

    private String receiverId;


    private String content;
}
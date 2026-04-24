package com.vendora.chat_service.controller;

import com.vendora.chat_service.dto.ChatConversationDTO;
import com.vendora.chat_service.dto.MessageDTO;
import com.vendora.chat_service.facade.ChatFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/message")
public class MessageController {

    private final ChatFacade chatFacade;

    /**
     * Returns the chat history between a user and a provider.
     *
     * The caller (Gateway) injects X-User-Id — we use that to validate
     * that the requester is actually one of the two participants.
     * This prevents user A from reading the conversation between B and C.
     */
    @GetMapping("/{userId}/{providerId}")
    public ResponseEntity<List<MessageDTO>> getMessages(
            @PathVariable String userId,
            @PathVariable String providerId,
            @RequestHeader("X-User-Id") String requesterId) {

        // Authorization check: only the two participants may read this conversation
        if (!requesterId.equals(userId) && !requesterId.equals(providerId)) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(chatFacade.getChatHistory(userId, providerId));
    }

    /**
     * Returns all conversations for the authenticated user.
     * userId is taken from the gateway-injected header, not the path,
     * so a user cannot request another user's conversation list.
     */
    @GetMapping("/conversations")
    public ResponseEntity<List<ChatConversationDTO>> getConversations(
            @RequestHeader("X-User-Id") String userId) {

        return ResponseEntity.ok(chatFacade.getConversations(userId));
    }
}
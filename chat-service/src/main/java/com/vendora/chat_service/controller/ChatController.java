package com.vendora.chat_service.controller;

import com.vendora.chat_service.dto.ChatMessageDTO;
import com.vendora.chat_service.facade.ChatFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ChatFacade chatFacade;

    /**
     * Handles incoming chat messages over WebSocket.
     *
     * Principal is injected by Spring from the WebSocket session — it was set in
     * WebsocketAuthConfig during CONNECT. It is the authenticated userId.
     *
     * CRITICAL: we NEVER trust dto.getSenderId() from the client payload.
     * We always use principal.getName() as the senderId. This prevents a user
     * from forging messages as someone else by setting a different senderId in the payload.
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessageDTO dto, Principal principal) {

        if (principal == null) {
            // Should never happen because WebsocketAuthConfig rejects unauthenticated
            // CONNECT frames, but guard anyway.
            log.warn("Unauthenticated message attempt rejected — no principal on session");
            return;
        }

        // Overwrite senderId with the server-verified identity — ignore what the client sent
        dto.setSenderId(principal.getName());

        chatFacade.handleSendMessage(dto);
    }
}
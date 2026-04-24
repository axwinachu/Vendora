package com.vendora.chat_service.facade;

import com.vendora.chat_service.dto.ChatConversationDTO;
import com.vendora.chat_service.dto.ChatMessageDTO;
import com.vendora.chat_service.dto.MessageDTO;
import com.vendora.chat_service.model.ChatRoom;
import com.vendora.chat_service.model.Message;
import com.vendora.chat_service.service.ChatRoomService;
import com.vendora.chat_service.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatFacade {

    private final ChatRoomService chatRoomService;
    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Persists the message and delivers it to both sender and receiver.
     *
     * Sender echo is required so the sender's other open tabs/devices
     * also receive the message in real time.
     *
     * We send a MessageDTO (not the raw Message entity) to avoid leaking
     * chatRoomId and other internal fields over the WebSocket.
     */
    public void handleSendMessage(ChatMessageDTO dto) {
        // getOrCreateRoom — correct here because sending a message initialises the conversation
        ChatRoom room = chatRoomService.getOrCreateRoom(dto.getUserId(), dto.getProviderId());

        Message saved = messageService.saveMessage(
                room,
                dto.getSenderId(),    // already overwritten by ChatController from Principal
                dto.getReceiverId(),
                dto.getContent(),
                dto.getClientId()
        );

        MessageDTO response = MessageDTO.from(saved);

        // Deliver to receiver — /user/{receiverId}/queue/messages
        messagingTemplate.convertAndSendToUser(dto.getReceiverId(), "/queue/messages", response);

        // Echo to sender — /user/{senderId}/queue/messages
        // This keeps all the sender's tabs/devices in sync and confirms delivery
        messagingTemplate.convertAndSendToUser(dto.getSenderId(), "/queue/messages", response);

        log.info("Message delivered — roomId={}, msgId={}, from={} to={}",
                room.getId(), saved.getId(), dto.getSenderId(), dto.getReceiverId());
    }

    /**
     * Returns chat history as DTOs.
     * Uses findRoom (NOT getOrCreateRoom) — we must NOT create a room just because
     * someone fetched history. If no room exists, there are no messages → return empty.
     */
    public List<MessageDTO> getChatHistory(String userId, String providerId) {
        return chatRoomService.findRoom(userId, providerId)
                .map(room -> messageService.getMessages(room.getId())
                        .stream()
                        .map(MessageDTO::from)
                        .toList())
                .orElse(List.of());
    }

    public List<ChatConversationDTO> getConversations(String userId) {
        return messageService.getConversations(userId);
    }
}
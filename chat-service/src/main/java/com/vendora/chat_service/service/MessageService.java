package com.vendora.chat_service.service;

import com.vendora.chat_service.client.ProviderClient;
import com.vendora.chat_service.client.UserClient;
import com.vendora.chat_service.dto.ChatConversationDTO;
import com.vendora.chat_service.dto.ProviderResponse;
import com.vendora.chat_service.dto.UserResponse;
import com.vendora.chat_service.model.ChatRoom;
import com.vendora.chat_service.model.Message;
import com.vendora.chat_service.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserClient userClient;
    private final ProviderClient providerClient;

    // Maximum messages scanned to build the conversation list.
    // Prevents full-table scans on active users.
    private static final int CONVERSATION_SCAN_LIMIT = 500;

    public Message saveMessage(ChatRoom room, String senderId, String receiverId,
                               String content, String clientId) {
        Message msg = messageRepository.save(
                Message.builder()
                        .chatRoomId(room.getId())
                        .senderId(senderId)
                        .receiverId(receiverId)
                        .content(content)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
        // clientId is @Transient — not persisted, but the Java object still holds it
        // after save() returns. We set it here so ChatFacade can echo it back to the
        // sender for frontend deduplication (matching the pending bubble to the saved msg).
        msg.setClientId(clientId);
        return msg;
    }

    public List<Message> getMessages(Long roomId) {
        return messageRepository.findByChatRoomIdOrderByTimestampAsc(roomId);
    }

    public List<ChatConversationDTO> getConversations(String userId) {

        // Bounded query — never scan more than CONVERSATION_SCAN_LIMIT rows
        List<Message> messages = messageRepository.findAllUserMessages(
                userId,
                PageRequest.of(0, CONVERSATION_SCAN_LIMIT)
        );

        // Keep only the latest message per peer (messages are already newest-first)
        Map<String, Message> latestByPeer = new LinkedHashMap<>();
        for (Message msg : messages) {
            String peerId = msg.getSenderId().equals(userId)
                    ? msg.getReceiverId()
                    : msg.getSenderId();
            latestByPeer.putIfAbsent(peerId, msg);  // first entry = latest (DESC order)
        }

        return latestByPeer.entrySet().stream()
                .map(entry -> buildConversationDTO(userId, entry.getKey(), entry.getValue()))
                .toList();
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private ChatConversationDTO buildConversationDTO(String userId, String peerId, Message latestMsg) {
        String peerName  = peerId;   // fallback: raw ID if lookup fails
        String peerImage = null;

        // Try user service first, then provider service.
        // Log failures at WARN — don't swallow them silently with System.out.
        try {
            UserResponse user = userClient.getUserById(peerId);
            if (user != null && user.getUserName() != null) {
                peerName  = user.getUserName();
                peerImage = user.getProfilePhotoUrl();
                return new ChatConversationDTO(peerId, peerName, peerImage,
                        latestMsg.getContent(), latestMsg.getTimestamp());
            }
        } catch (Exception e) {
            log.debug("Peer {} not found in user-service, trying provider-service", peerId);
        }

        try {
            ProviderResponse provider = providerClient.getProvider(peerId);
            if (provider != null) {
                peerName  = provider.getBusinessName();
                peerImage = provider.getProfilePhotoUrl();
            }
        } catch (Exception e) {
            log.warn("Peer {} not found in user-service OR provider-service", peerId);
        }

        return new ChatConversationDTO(peerId, peerName, peerImage,
                latestMsg.getContent(), latestMsg.getTimestamp());
    }
}
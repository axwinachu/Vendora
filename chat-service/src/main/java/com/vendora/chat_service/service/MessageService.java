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
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserClient userClient;
    private final ProviderClient providerClient;

    // ✅ Save message
    public Message saveMessage(ChatRoom room, String senderId, String receiverId, String content,String clientId) {
        Message msg = messageRepository.save(
                Message.builder()
                        .chatRoomId(room.getId())
                        .senderId(senderId)
                        .receiverId(receiverId)
                        .content(content)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
        msg.setClientId(clientId);
        return msg;

    }


    public List<Message> getMessages(Long roomId) {
        return messageRepository.findByChatRoomIdOrderByTimestampAsc(roomId);
    }

    public List<ChatConversationDTO> getConversations(String userId) {

        List<Message> messages = messageRepository.findAllUserMessages(userId);

        Map<String, Message> latestMap = new HashMap<>();

        for (Message msg : messages) {

            String peerId = msg.getSenderId().equals(userId)
                    ? msg.getReceiverId()
                    : msg.getSenderId();

            if (!latestMap.containsKey(peerId)) {
                latestMap.put(peerId, msg);
            }
        }

        return latestMap.entrySet().stream()
                .map(entry -> {

                    String peerId = entry.getKey();
                    Message msg = entry.getValue();

                    // 🔥 CALL USER SERVICE
                    UserResponse user = null;
                    ProviderResponse provider = null;

                    try {
                        user = userClient.getUserById(peerId);
                    } catch (Exception e) {
                        try {
                            provider = providerClient.getProvider(peerId);
                        } catch (Exception ex) {
                            System.out.println("User/Provider fetch failed: " + peerId);
                        }
                    }



                    String peerName;
                    String peerImage;

                    if (user != null && user.getUserName() != null) {
                        peerName = user.getUserName();
                        peerImage = user.getProfilePhotoUrl();

                    } else if (provider != null) {
                        peerName = provider.getBusinessName();
                        peerImage = provider.getProfilePhotoUrl();

                    } else {
                        peerName = peerId;
                        peerImage = null;
                    }

                    return new ChatConversationDTO(
                            peerId,
                            peerName,
                            peerImage,
                            msg.getContent(),
                            msg.getTimestamp()
                    );
                })
                .toList();
    }
}
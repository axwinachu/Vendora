package com.vendora.chat_service.service;

import com.vendora.chat_service.dto.ChatConversationDTO;
import com.vendora.chat_service.model.ChatRoom;
import com.vendora.chat_service.model.Message;
import com.vendora.chat_service.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    public Message saveMessage(ChatRoom room, String senderId, String receiverId, String content){
        return messageRepository.save(Message.builder()
                .chatRoomId(room.getId())
                .senderId(senderId)
                .receiverId(receiverId)
                .content(content)
                .timestamp(LocalDateTime.now())
                .build());
    }
    public List<Message> getMessages(Long roomId){
        return messageRepository.findByChatRoomId(roomId);
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
                    String peerName = peerId;

                    return new ChatConversationDTO(
                            peerId,
                            peerName,
                            msg.getContent(),
                            msg.getTimestamp()
                    );
                })
                .toList();
    }
}

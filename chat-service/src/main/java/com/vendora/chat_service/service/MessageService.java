package com.vendora.chat_service.service;

import com.vendora.chat_service.model.ChatRoom;
import com.vendora.chat_service.model.Message;
import com.vendora.chat_service.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

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
}

package com.vendora.chat_service.facade;

import com.vendora.chat_service.dto.ChatConversationDTO;
import com.vendora.chat_service.dto.ChatMessageDTO;
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
    public void handleSendMessage(ChatMessageDTO dto) {
        ChatRoom room=chatRoomService.getOrCreateRoom(dto.getUserId(),dto.getProviderId());

        Message saved=messageService.saveMessage(room, dto.getSenderId(),dto.getReceiverId(), dto.getContent(),dto.getClientId());

        messagingTemplate.convertAndSendToUser(dto.getReceiverId(),"/queue/messages",saved);

        messagingTemplate.convertAndSendToUser(dto.getSenderId(),"/queue/messages",saved);

        log.info("message delivered -room {} ,id {}",room.getId(),saved.getId());

    }
    public List<Message> getChatHistory(String userId,String providerId){
        ChatRoom room=chatRoomService.getOrCreateRoom(userId,providerId);
        return messageService.getMessages(room.getId());
    }

    public List<ChatConversationDTO> getConversations(String userId) {
        return messageService.getConversations(userId);
    }
}

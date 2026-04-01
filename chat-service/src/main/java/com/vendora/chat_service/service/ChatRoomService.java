package com.vendora.chat_service.service;

import com.vendora.chat_service.model.ChatRoom;
import com.vendora.chat_service.repository.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatRoomService {
    private final ChatRoomRepository chatRoomRepository;
    public ChatRoom getOrCreateRoom(String userId,String providerId){
        return chatRoomRepository.findByUserIdAndProviderId(userId,providerId)
                .orElseGet(()->{
                   return  chatRoomRepository.save(
                           ChatRoom.builder()
                                   .userId(userId)
                                   .providerId(providerId)
                                   .build()
                   );
                });
    }
}

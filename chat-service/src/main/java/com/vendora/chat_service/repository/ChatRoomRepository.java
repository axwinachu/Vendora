package com.vendora.chat_service.repository;

import com.vendora.chat_service.model.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom,Long> {
    Optional<ChatRoom> findByUserIdAndProviderId(String userId,String providerId);
}

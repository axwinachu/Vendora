package com.vendora.chat_service.repository;

import com.vendora.chat_service.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


public interface MessageRepository extends JpaRepository<Message,Long> {
    List<Message> findByChatRoomId(Long chatRoomId);
}

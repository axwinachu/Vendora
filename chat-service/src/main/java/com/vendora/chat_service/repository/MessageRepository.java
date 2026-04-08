package com.vendora.chat_service.repository;

import com.vendora.chat_service.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;


public interface MessageRepository extends JpaRepository<Message,Long> {
    List<Message> findByChatRoomId(Long chatRoomId);

    @Query("""
    SELECT m FROM Message m
    WHERE m.senderId = :userId OR m.receiverId = :userId
    ORDER BY m.timestamp DESC
""")
    List<Message> findAllUserMessages(@Param("userId") String userId);
}
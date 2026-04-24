package com.vendora.chat_service.repository;

import com.vendora.chat_service.model.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    // Used for chat history — ordered oldest first for correct display order
    List<Message> findByChatRoomIdOrderByTimestampAsc(Long chatRoomId);

    /**
     * For conversation list: get all messages where this user is sender OR receiver,
     * newest first, with a hard page limit so we never scan the full table.
     *
     * Callers should pass PageRequest.of(0, 500) — enough to cover all conversations
     * without risking an unbounded scan on an active user.
     */
    @Query("""
        SELECT m FROM Message m
        WHERE m.senderId = :userId OR m.receiverId = :userId
        ORDER BY m.timestamp DESC
    """)
    List<Message> findAllUserMessages(@Param("userId") String userId, Pageable pageable);
}
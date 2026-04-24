package com.vendora.chat_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(
        name = "message",
        indexes = {
                @Index(name = "idx_message_room_ts", columnList = "chat_room_id, timestamp"),
                @Index(name = "idx_message_sender",  columnList = "sender_id"),
                @Index(name = "idx_message_receiver", columnList = "receiver_id")
        }
)
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // clientId is a frontend-generated UUID for optimistic UI deduplication.
    // It must NOT be persisted (correct) and must be sent back over WebSocket
    // so the frontend can match the echo to its pending message.
    // @Transient means JPA ignores it — the field survives in the Java object
    // after save() returns, so we can still send it via SimpMessagingTemplate.
    @Transient
    private String clientId;

    @Column(name = "chat_room_id", nullable = false)
    private Long chatRoomId;

    @Column(name = "sender_id", nullable = false)
    private String senderId;

    @Column(name = "receiver_id", nullable = false)
    private String receiverId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private LocalDateTime timestamp;
}
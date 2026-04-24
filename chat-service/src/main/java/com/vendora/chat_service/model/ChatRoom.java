package com.vendora.chat_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(
        name = "chat_room",
        uniqueConstraints = @UniqueConstraint(
                name = "uc_chat_room_user_provider",
                columnNames = {"user_id", "provider_id"}
        )
)
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Always stored as: smaller UUID = userId, larger UUID = providerId
    // to guarantee one room per pair regardless of who initiates
    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "provider_id", nullable = false)
    private String providerId;
}
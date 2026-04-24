package com.vendora.chat_service.service;

import com.vendora.chat_service.model.ChatRoom;
import com.vendora.chat_service.repository.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatRoomService {

    private final ChatRoomRepository chatRoomRepository;

    /**
     * Returns the existing room for this user+provider pair, or creates one.
     *
     * Canonical order: we always try (userId, providerId) first.
     * The DB unique constraint on (user_id, provider_id) prevents duplicates.
     *
     * @Transactional ensures the find → create is atomic.
     * DataIntegrityViolationException handles the rare race condition where two
     * requests try to create the same room simultaneously — we catch the constraint
     * violation and re-fetch the row that the other thread just created.
     */
    @Transactional
    public ChatRoom getOrCreateRoom(String userId, String providerId) {

        // Check both orderings — whoever initiated first defines the stored order
        Optional<ChatRoom> existing = chatRoomRepository
                .findByUserIdAndProviderId(userId, providerId)
                .or(() -> chatRoomRepository.findByUserIdAndProviderId(providerId, userId));

        if (existing.isPresent()) {
            return existing.get();
        }

        try {
            ChatRoom room = chatRoomRepository.save(
                    ChatRoom.builder()
                            .userId(userId)
                            .providerId(providerId)
                            .build()
            );
            log.info("Created new chat room id={} for user={} provider={}", room.getId(), userId, providerId);
            return room;

        } catch (DataIntegrityViolationException e) {
            // Race condition: another thread created the room between our find and save.
            // Re-fetch — it must exist now.
            log.warn("Race condition on room creation for user={} provider={}, re-fetching", userId, providerId);
            return chatRoomRepository.findByUserIdAndProviderId(userId, providerId)
                    .or(() -> chatRoomRepository.findByUserIdAndProviderId(providerId, userId))
                    .orElseThrow(() -> new IllegalStateException(
                            "Room not found after constraint violation for user=" + userId));
        }
    }

    /**
     * Used for chat history — does NOT create a room if one doesn't exist.
     * Returning empty is correct: no room = no messages.
     */
    public Optional<ChatRoom> findRoom(String userId, String providerId) {
        return chatRoomRepository.findByUserIdAndProviderId(userId, providerId)
                .or(() -> chatRoomRepository.findByUserIdAndProviderId(providerId, userId));
    }
}
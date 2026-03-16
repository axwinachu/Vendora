package com.vendora.user_service.mapper;

import com.vendora.user_service.dto.UserResponse;
import com.vendora.user_service.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    private UserMapper() {
        // private constructor to prevent instantiation
    }

    public UserResponse toResponse(User user) {
        if (user == null) {
            return null;
        }

        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .profilePhotoUrl(user.getProfilePhotoUrl())
                .role(user.getRole())
                .district(user.getDistrict())
                .latitude(user.getLatitude())
                .longitude(user.getLongitude())
                .locationSet(user.getLatitude() != null && user.getLongitude() != null)
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
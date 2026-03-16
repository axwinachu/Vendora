package com.vendora.user_service.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.vendora.user_service.enums.District;
import com.vendora.user_service.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {
    private String id;
    private String name;
    private String email;
    private String phone;
    private String profilePhotoUrl;
    private Role role;
    private District district;
    private Boolean active;

    private Double latitude;
    private Double longitude;
    private Boolean locationSet;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}

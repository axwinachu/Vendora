package com.vendora.user_service.model;

import com.vendora.user_service.enums.District;
import com.vendora.user_service.enums.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
@Table(name = "user_details")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    @Column(nullable = false,unique = true,length = 100)
    private  String email;

    @Column(nullable = false,length = 100)
    private String name;

    @Column(length = 15)
    private String phone;


    private String profilePhotoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    private District district;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active=true;

    @Column(precision = 10)
    private Double latitude;

    @Column(precision = 10)
    private Double longitude;


    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

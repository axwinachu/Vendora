package com.vendora.auth_service.model;

import com.vendora.auth_service.enums.Role;
import com.vendora.auth_service.enums.Status;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "customer")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique=true,nullable=false)
    private String email;

    private String password;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private Role role=Role.CUSTOMER;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private Status status=Status.ACTIVE;

    @Builder.Default
    private boolean emailVerified=false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

}

package com.vendora.auth_service.repository;

import com.vendora.auth_service.model.Credential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
@Repository
public interface AuthRepository extends JpaRepository<Credential,Long> {
    Optional<Credential> findByEmail(String email);

    boolean existSByEmail(String email);
}

package com.vendora.auth_service.repository;

import com.vendora.auth_service.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import javax.swing.text.html.Option;
import java.util.Optional;

@Repository
public interface AuthRepository extends JpaRepository<User,String> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}

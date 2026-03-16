package com.vendora.user_service.repository;

import com.vendora.user_service.enums.District;
import com.vendora.user_service.enums.Role;
import com.vendora.user_service.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User,String> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(Role role);

    List<User> findByDistrict(District district);

    List<User> findByDistrictAndRole(District district,Role role);

    List<User> findByActive(Boolean active);
}

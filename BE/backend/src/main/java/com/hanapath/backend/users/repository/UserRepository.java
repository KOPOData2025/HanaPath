package com.hanapath.backend.users.repository;

import com.hanapath.backend.users.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);
    boolean existsByPhone(String phone);
    boolean existsByNickname(String nickname);
    Optional<User> findByPhone(String phone);
    
    @Query("SELECT u.id FROM User u")
    List<Long> findAllUserIds();
}
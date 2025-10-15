package com.hanapath.backend.users.repository;

import com.hanapath.backend.users.entity.ExperienceEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface ExperienceEventRepository extends JpaRepository<ExperienceEvent, Long> {
    boolean existsByIdempotencyKey(String idempotencyKey);
    int countByUser_IdAndTypeAndEventDate(Long userId, ExperienceEvent.ExperienceType type, LocalDate eventDate);
}



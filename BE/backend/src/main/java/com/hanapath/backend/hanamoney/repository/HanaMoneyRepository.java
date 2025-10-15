package com.hanapath.backend.hanamoney.repository;

import com.hanapath.backend.hanamoney.entity.HanaMoney;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HanaMoneyRepository extends JpaRepository<HanaMoney, Long> {
    
    Optional<HanaMoney> findByUserId(Long userId);
    
    @Query("SELECT h FROM HanaMoney h WHERE h.user.id = :userId")
    Optional<HanaMoney> findHanaMoneyByUserId(@Param("userId") Long userId);
    
    boolean existsByUserId(Long userId);
} 
package com.hanapath.backend.hanamoney.repository;

import com.hanapath.backend.hanamoney.entity.HanaMoneyConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HanaMoneyConfigRepository extends JpaRepository<HanaMoneyConfig, Long> {
    
    Optional<HanaMoneyConfig> findByConfigType(HanaMoneyConfig.ConfigType configType);
    
    List<HanaMoneyConfig> findByIsActiveTrue();
    
    Optional<HanaMoneyConfig> findByConfigTypeAndIsActiveTrue(HanaMoneyConfig.ConfigType configType);
} 
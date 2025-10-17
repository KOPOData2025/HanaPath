package com.hanapath.backend.stock.repository;

import com.hanapath.backend.stock.entity.StockMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StockMasterRepository extends JpaRepository<StockMaster, Long> {
    Optional<StockMaster> findByTicker(String ticker);
    boolean existsByTicker(String ticker);
}

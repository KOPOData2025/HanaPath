package com.hanapath.backend.investment.repository;

import com.hanapath.backend.investment.entity.StockHolding;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StockHoldingRepository extends JpaRepository<StockHolding, Long> {
    Optional<StockHolding> findByUserIdAndTicker(Long userId, String ticker);
    List<StockHolding> findByUserId(Long userId);
}

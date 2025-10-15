package com.hanapath.backend.investment.repository;

import com.hanapath.backend.investment.entity.StockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {
    List<StockTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<StockTransaction> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}

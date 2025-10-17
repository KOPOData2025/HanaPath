package com.hanapath.backend.investment.repository;

import com.hanapath.backend.investment.entity.StockFavorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StockFavoriteRepository extends JpaRepository<StockFavorite, Long> {
    boolean existsByUserIdAndTicker(Long userId, String ticker);
    Optional<StockFavorite> findByUserIdAndTicker(Long userId, String ticker);
    List<StockFavorite> findByUserId(Long userId);
}

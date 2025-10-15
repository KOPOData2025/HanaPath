package com.hanapath.backend.stock.repository;

import com.hanapath.backend.stock.entity.StockHistoricalData;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StockHistoricalDataRepository extends JpaRepository<StockHistoricalData, Long> {
    
    // 특정 종목의 특정 날짜 데이터 조회
    Optional<StockHistoricalData> findByTickerAndDate(String ticker, String date);
    
    // 특정 종목의 최신 데이터 조회
    @Query("SELECT h FROM StockHistoricalData h WHERE h.ticker = :ticker ORDER BY h.date DESC")
    List<StockHistoricalData> findByTickerOrderByDateDesc(@Param("ticker") String ticker, Pageable pageable);
    
    // 특정 종목의 특정 기간 데이터 조회
    @Query("SELECT h FROM StockHistoricalData h WHERE h.ticker = :ticker AND h.date >= :startDate AND h.date <= :endDate ORDER BY h.date ASC")
    List<StockHistoricalData> findByTickerAndDateBetween(
        @Param("ticker") String ticker, 
        @Param("startDate") String startDate, 
        @Param("endDate") String endDate
    );
    
    // 특정 종목의 데이터 개수 조회
    long countByTicker(String ticker);
}




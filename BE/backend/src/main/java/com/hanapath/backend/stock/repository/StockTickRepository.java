package com.hanapath.backend.stock.repository;

import com.hanapath.backend.stock.entity.StockTick;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface StockTickRepository extends MongoRepository<StockTick, String> {
    List<StockTick> findByTickerAndTimestampBetween(String ticker, LocalDateTime start, LocalDateTime end);
}

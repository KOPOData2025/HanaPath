package com.hanapath.backend.stock.repository;

import com.hanapath.backend.stock.document.StockRealtimeDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StockRealtimeRepository extends MongoRepository<StockRealtimeDocument, String> {
}

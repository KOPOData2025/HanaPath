package com.hanapath.backend.stock.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "stock_ticks")
@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class StockTick {

    @Id
    private String id;

    private String ticker;
    private int price;
    private long volume;
    private List<Integer> askPrices;
    private List<Integer> bidPrices;
    private List<Long> askVolumes;
    private List<Long> bidVolumes;
    private LocalDateTime timestamp;
}

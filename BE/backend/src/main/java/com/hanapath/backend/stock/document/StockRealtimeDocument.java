package com.hanapath.backend.stock.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "realtime_prices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockRealtimeDocument {

    @Id
    private String id;

    private String ticker;
    private int price;
    private int volume;
    private List<Integer> askPrices;
    private List<Integer> bidPrices;
    private List<Long> askVolumes;
    private List<Long> bidVolumes;
    private long timestamp;
}

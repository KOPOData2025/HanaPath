package com.hanapath.backend.stock.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class RealtimeStockDto {
    private String ticker;
    private String stockName;
    private Integer price;
    private Float rate;
    private Long volume;
    private List<Integer> askPrices; // 매도호가 10단
    private List<Integer> bidPrices; // 매수호가 10단
    private List<Long> askVolumes; // 매도잔량 10단
    private List<Long> bidVolumes; // 매수잔량 10단
    private Long timestamp;
}

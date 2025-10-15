package com.hanapath.backend.stock.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class StockDetailDto {
    private String ticker;
    private Integer price;
    private Long volume;
    private List<Integer> askPrices; // 매도호가 10단
    private List<Integer> bidPrices; // 매수호가 10단
    private List<Long> askVolumes; // 매도잔량 10단
    private List<Long> bidVolumes; // 매수잔량 10단
    private Long timestamp;
}

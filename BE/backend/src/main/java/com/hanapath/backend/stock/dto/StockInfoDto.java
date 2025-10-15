package com.hanapath.backend.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockInfoDto {
    private String ticker;          // 종목코드
    private String name;            // 종목명
    private int currentPrice;       // 현재가
    private int changeAmount;       // 전일대비
    private double changeRate;      // 등락률
    private int openPrice;          // 시가
    private int highPrice;          // 고가
    private int lowPrice;           // 저가
    private long volume;            // 거래량
    private long tradingValue;      // 거래대금
    private long marketCap;         // 시가총액
    private long capital;           // 자본금
    private double per;             // PER
    private double pbr;             // PBR
    private int eps;                // EPS
    private int bps;                // BPS
    private String sector;          // 업종명
    private long listingShares;     // 상장주수
} 
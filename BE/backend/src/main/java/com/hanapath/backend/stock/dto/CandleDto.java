package com.hanapath.backend.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandleDto {
    private String date;     // 날짜 (YYYYMMDD)
    private String time;     // 시간 (HHMMSS) - 분봉용
    private int open;        // 시가
    private int high;        // 고가
    private int low;         // 저가
    private int close;       // 종가
    private long volume;     // 거래량
    private String ticker;   // 종목코드
} 
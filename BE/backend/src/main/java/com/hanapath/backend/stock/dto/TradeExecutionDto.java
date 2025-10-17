package com.hanapath.backend.stock.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TradeExecutionDto {
    // KIS API 필드명 기반
    private String ticker;     
    private int price;           
    private long volume;         
    private long totalVolume;    
    private String tradeType;    
    private double rate;         
    private String time;        
    private long timestamp;      
}

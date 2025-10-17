package com.hanapath.backend.stock.controller;

import com.hanapath.backend.stock.dto.RealtimeStockDto;
import com.hanapath.backend.stock.dto.StockDetailDto;
import com.hanapath.backend.stock.dto.TradeExecutionDto;
import com.hanapath.backend.stock.publisher.StockRealtimePublisher;
import com.hanapath.backend.stock.service.ActiveSubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/stock")
public class StockRealtimeController {

    private final StockRealtimePublisher publisher;
    private final ActiveSubscriptionService subscriptionService;

    @PostMapping("/realtime/summary")
    public ResponseEntity<Void> receiveSummary(@RequestBody RealtimeStockDto dto) {
        // WebSocket으로 브로드캐스트
        publisher.sendSummary(dto);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/realtime/detail")
    public ResponseEntity<Void> receiveDetail(@RequestBody StockDetailDto dto) {
        String currentTime = java.time.LocalTime.now().toString().substring(0, 8);
        
        // 활성 구독자 체크
        boolean hasSubscribers = subscriptionService.hasActiveSubscribers(dto.getTicker());
        System.out.println(String.format("[%s] 호가 데이터 체크: %s - 활성구독자: %s", 
            currentTime, dto.getTicker(), hasSubscribers ? "있음" : "없음"));
        
        if (hasSubscribers) {
            System.out.println(String.format("[%s] 호가 데이터 브로드캐스트: %s - 현재가: %s원, 거래량: %s, 매도1호가: %s, 매수1호가: %s, 매도1잔량: %s, 매수1잔량: %s", 
                currentTime, dto.getTicker(), 
                dto.getPrice() != 0 ? String.format("%,d", dto.getPrice()) : "0",
                dto.getVolume() != 0 ? String.format("%,d", dto.getVolume()) : "0",
                !dto.getAskPrices().isEmpty() && dto.getAskPrices().get(0) != 0 ? String.format("%,d", dto.getAskPrices().get(0)) : "0",
                !dto.getBidPrices().isEmpty() && dto.getBidPrices().get(0) != 0 ? String.format("%,d", dto.getBidPrices().get(0)) : "0",
                !dto.getAskVolumes().isEmpty() && dto.getAskVolumes().get(0) != 0 ? String.format("%,d", dto.getAskVolumes().get(0)) : "0",
                !dto.getBidVolumes().isEmpty() && dto.getBidVolumes().get(0) != 0 ? String.format("%,d", dto.getBidVolumes().get(0)) : "0"
            ));
            
            // WebSocket으로 브로드캐스트
            publisher.sendDetail(dto);
        } else {
            System.out.println(String.format("[%s] %s 호가 데이터 스킵 - 활성 구독자 없음", currentTime, dto.getTicker()));
        }
        
        return ResponseEntity.ok().build();
    }

    @PostMapping("/realtime/execution")
    public ResponseEntity<Void> receiveExecution(@RequestBody TradeExecutionDto dto) {
        String currentTime = java.time.LocalTime.now().toString().substring(0, 8);
        
        // 활성 구독자 체크
        boolean hasSubscribers = subscriptionService.hasActiveSubscribers(dto.getTicker());
        System.out.println(String.format("[%s] 체결 데이터 체크: %s - 활성구독자: %s", 
            currentTime, dto.getTicker(), hasSubscribers ? "있음" : "없음"));
        
        if (hasSubscribers) {
            System.out.println(String.format("[%s] 체결가 데이터 브로드캐스트: %s - 체결가: %s원, 체결량: %s주, 구분: %s, 시간: %s", 
                currentTime, dto.getTicker(), 
                String.format("%,d", dto.getPrice()),
                String.format("%,d", dto.getVolume()),
                dto.getTradeType(),
                dto.getTime()
            ));
            
            // WebSocket으로 브로드캐스트
            publisher.sendExecution(dto);
        } else {
            System.out.println(String.format("[%s] %s 체결 데이터 스킵 - 활성 구독자 없음", currentTime, dto.getTicker()));
        }
        
        return ResponseEntity.ok().build();
    }
}

package com.hanapath.backend.stock.controller;

import com.hanapath.backend.stock.service.ActiveSubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/stock/subscription")
@Slf4j
public class StockSubscriptionController {
    
    private final ActiveSubscriptionService subscriptionService;
    
    /**
     * 종목 구독 시작
     */
    @PostMapping("/{ticker}/subscribe")
    public ResponseEntity<Void> subscribe(@PathVariable String ticker) {
        log.info("종목 구독 요청: {}", ticker);
        subscriptionService.subscribe(ticker);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 종목 구독 해제
     */
    @PostMapping("/{ticker}/unsubscribe")
    public ResponseEntity<Void> unsubscribe(@PathVariable String ticker) {
        log.info("종목 구독 해제 요청: {}", ticker);
        subscriptionService.unsubscribe(ticker);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 현재 활성 구독 현황 조회
     */
    @GetMapping("/status")
    public ResponseEntity<Integer> getActiveSubscriptionCount() {
        int count = subscriptionService.getActiveStockCount();
        log.info("현재 활성 구독 종목 수: {}", count);
        return ResponseEntity.ok(count);
    }
} 
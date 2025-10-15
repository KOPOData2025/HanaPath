package com.hanapath.backend.stock.publisher;

import com.hanapath.backend.stock.dto.RealtimeStockDto;
import com.hanapath.backend.stock.dto.StockDetailDto;
import com.hanapath.backend.stock.dto.TradeExecutionDto;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StockRealtimePublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendSummary(RealtimeStockDto dto) {
        messagingTemplate.convertAndSend("/topic/stock/summary", dto);
    }

    public void sendDetail(StockDetailDto dto) {
        String topic = "/topic/stock/" + dto.getTicker();
        String currentTime = java.time.LocalTime.now().toString().substring(0, 8);
        System.out.println(String.format("[%s] WebSocket 호가 브로드캐스트: %s → %s (현재가: %s원)", 
            currentTime, dto.getTicker(), topic, 
            dto.getPrice() != 0 ? String.format("%,d", dto.getPrice()) : "0"));
        messagingTemplate.convertAndSend(topic, dto);
    }

    public void sendExecution(TradeExecutionDto dto) {
        String topic = "/topic/stock/" + dto.getTicker() + "/execution";
        String currentTime = java.time.LocalTime.now().toString().substring(0, 8);
        System.out.println(String.format("[%s] WebSocket 체결 브로드캐스트: %s → %s (체결가: %s원, 구분: %s)", 
            currentTime, dto.getTicker(), topic, 
            String.format("%,d", dto.getPrice()), dto.getTradeType()));
        messagingTemplate.convertAndSend(topic, dto);
    }
}

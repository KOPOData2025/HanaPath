package com.hanapath.backend.stock.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@Slf4j
@RequiredArgsConstructor
public class ActiveSubscriptionService {
    
    // 종목별 활성 구독자 수
    private final ConcurrentHashMap<String, AtomicInteger> activeSubscribers = new ConcurrentHashMap<>();
    
    // Python 클라이언트 API URL
    @Value("${app.urls.python-api}")
    private String pythonApiUrl;
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    /**
     * 종목 구독 시작
     */
    public void subscribe(String ticker) {
        boolean isFirstSubscriber = !activeSubscribers.containsKey(ticker);
        activeSubscribers.computeIfAbsent(ticker, k -> new AtomicInteger(0)).incrementAndGet();
        
        log.info("{} 구독 시작 - 현재 구독자 수: {}", ticker, activeSubscribers.get(ticker).get());
        log.info("전체 활성 구독 종목: {}", activeSubscribers.keySet());
        System.out.println(String.format("[%s] %s 구독 활성화 - 구독자: %d명", 
            java.time.LocalTime.now().toString().substring(0, 8),
            ticker, 
            activeSubscribers.get(ticker).get()));
            
        // 첫 번째 구독자인 경우 Python 클라이언트에 구독 요청
        if (isFirstSubscriber) {
            requestPythonSubscription(ticker);
        }
    }
    
    /**
     * 종목 구독 해제
     */
    public void unsubscribe(String ticker) {
        AtomicInteger count = activeSubscribers.get(ticker);
        if (count != null) {
            int newCount = count.decrementAndGet();
            if (newCount <= 0) {
                activeSubscribers.remove(ticker);
                log.info("{} 구독 해제 완료 - 구독자 없음", ticker);
                // 마지막 구독자가 해제된 경우 Python 클라이언트에 구독 해제 요청
                requestPythonUnsubscription(ticker);
            } else {
                log.info("{} 구독자 감소 - 현재 구독자 수: {}", ticker, newCount);
            }
        }
    }
    
    /**
     * 해당 종목에 활성 구독자가 있는지 확인
     */
    public boolean hasActiveSubscribers(String ticker) {
        AtomicInteger count = activeSubscribers.get(ticker);
        return count != null && count.get() > 0;
    }
    
    /**
     * 현재 활성 구독 종목 수 반환
     */
    public int getActiveStockCount() {
        return activeSubscribers.size();
    }
    
    /**
     * Python 클라이언트에 구독 요청
     */
    private void requestPythonSubscription(String ticker) {
        try {
            String url = pythonApiUrl + "/subscribe/" + ticker;
            restTemplate.postForObject(url, null, String.class);
            log.info("Python 클라이언트에 {} 구독 요청 전송 성공", ticker);
            System.out.println(String.format("[%s] Python 클라이언트에 %s 구독 요청", 
                java.time.LocalTime.now().toString().substring(0, 8), ticker));
        } catch (Exception e) {
            log.error("Python 클라이언트 구독 요청 실패: {} - {}", ticker, e.getMessage());
            System.out.println(String.format("Python 클라이언트 구독 요청 실패: %s - %s", ticker, e.getMessage()));
        }
    }
    
    /**
     * Python 클라이언트에 구독 해제 요청
     */
    private void requestPythonUnsubscription(String ticker) {
        try {
            String url = pythonApiUrl + "/unsubscribe/" + ticker;
            restTemplate.postForObject(url, null, String.class);
            log.info("Python 클라이언트에 {} 구독 해제 요청 전송 성공", ticker);
            System.out.println(String.format("[%s] Python 클라이언트에 %s 구독 해제 요청", 
                java.time.LocalTime.now().toString().substring(0, 8), ticker));
        } catch (Exception e) {
            log.error("Python 클라이언트 구독 해제 요청 실패: {} - {}", ticker, e.getMessage());
            System.out.println(String.format("Python 클라이언트 구독 해제 요청 실패: %s - %s", ticker, e.getMessage()));
        }
    }
} 
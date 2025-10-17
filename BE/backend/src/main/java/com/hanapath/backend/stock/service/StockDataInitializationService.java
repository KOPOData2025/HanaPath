package com.hanapath.backend.stock.service;

import com.hanapath.backend.stock.dto.CandleDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockDataInitializationService implements ApplicationRunner {

    private final StockChartService stockChartService;
    private final StockHistoricalDataService historicalDataService;

    @Value("${app.data.initialization.enabled:true}")
    private boolean initializationEnabled;

    @Value("${app.data.initialization.period:180}")
    private int initializationPeriod;

    private final Executor executor = Executors.newFixedThreadPool(5); // 동시 처리 스레드 수

    // 주요 종목 목록
    private final List<String> majorTickers = Arrays.asList(
        "005930", // 삼성전자
        "000660", // SK하이닉스
        "373220", // LG에너지솔루션
        "207940", // 삼성바이오로직스
        "035420", // NAVER
        "006400", // 삼성SDI
        "005380", // 현대차
        "035720", // 카카오
        "005490", // POSCO홀딩스
        "000270", // 기아
        "051910", // LG화학
        "068270", // 셀트리온
        "012450", // 한화에어로스페이스
        "011200", // HMM
        "003490", // 대한항공
        "096770", // SK이노베이션
        "012330", // 현대모비스
        "090430", // 아모레퍼시픽
        "033780", // KT&G
        "066570", // LG전자
        "034020", // 두산에너빌리티
        "377300", // 카카오페이
        "259960", // 크래프톤
        "017670", // SK텔레콤
        "015760", // 한국전력
        "097950", // CJ제일제당
        "383220", // F&F
        "030000", // 제일기획
        "086790", // 하나금융지주
        "005830", // DB손해보험
        "105560", // KB금융
        "055550", // 신한지주
        "009150", // 삼성전기
        "247540", // 에코프로비엠
        "000880", // 한화
        "004020", // 현대제철
        "009830", // 한화솔루션
        "086280", // 현대글로비스
        "326030", // SK바이오팜
        "078930", // GS
        "010950", // S-Oil
        "267250", // HD현대
        "241560", // 두산밥캣
        "000810", // 삼성화재
        "005940", // NH투자증권
        "003550", // LG
        "017800", // 현대엘리베이터
        "006800", // 미래에셋증권
        "089470", // HDC현대EP
        "000100", // 유한양행
        "003230", // 삼양식품
        "028050", // 삼성E&A
        "029780", // 삼성카드
        "042660", // 한화오션
        "006360", // GS건설
        "001450", // 현대해상
        "032640", // LG유플러스
        "034730", // SK
        "002790", // 아모레퍼시픽홀딩스
        "034310", // NICE
        "000720", // 현대건설
        "069620", // 대웅제약
        "006280", // 녹십자
        "010060", // OCI홀딩스
        "021240", // 코웨이
        "047050", // 포스코인터내셔널
        "073240", // 금호타이어
        "282330", // BGF리테일
        "011780", // 금호석유화학
        "014680", // 한솔케미칼
        "042700", // 한미반도체
        "007310", // 오뚜기
        "000990", // DB하이텍
        "016360", // 삼성증권
        "272450", // 진에어
        "145720", // 덴티움
        "181710", // NHN
        "036570", // 엔씨소프트
        "251270", // 넷마블
        "001440", // 대한전선
        "030200", // KT
        "034220", // LG디스플레이
        "138040", // 메리츠금융지주
        "316140", // 우리금융지주
        "138930", // BNK금융지주
        "139130", // iM금융지주
        "004990", // 롯데지주
        "011170", // 롯데케미칼
        "047810", // 한국항공우주
        "006260", // LS
        "267260", // HD현대일렉트릭
        "272210", // 한화시스템
        "002380", // KCC
        "041510", // 에스엠
        "035900", // JYP Ent.
        "086520", // 에코프로
        "000640", // 동아쏘시오홀딩스
        "079550", // LIG넥스원
        "103140", // 풍산
        "009450"  // 경동나비엔
    );

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!initializationEnabled) {
            log.info("주식 데이터 초기화가 비활성화되어 있습니다.");
            return;
        }

        log.info("주식 과거 데이터 초기화 시작 - 총 {}개 종목, {}일 기간", majorTickers.size(), initializationPeriod);

        // 비동기로 데이터 초기화
        CompletableFuture.runAsync(this::initializeHistoricalData, executor);
        
        log.info("주식 데이터 초기화를 백그라운드에서 실행합니다. (약 {}분 소요 예상)", 
                (majorTickers.size() * 3) / 60); 
    }

    private void initializeHistoricalData() {
        int successCount = 0;
        int skipCount = 0;
        int failCount = 0;
        long startTime = System.currentTimeMillis();

        try {
            for (int i = 0; i < majorTickers.size(); i++) {
                String ticker = majorTickers.get(i);
                
                try {
                    // 이미 캐시된 데이터가 있는지 확인
                    if (historicalDataService.hasCachedDailyData(ticker) && historicalDataService.hasCachedWeeklyData(ticker)) {
                        log.info("{} 데이터가 이미 캐시되어 있음 ({}/{})", ticker, i + 1, majorTickers.size());
                        skipCount++;
                        continue;
                    }
                    
                    log.info("{} 과거 데이터 수집 중... ({}/{})", ticker, i + 1, majorTickers.size());

                    // 일봉 데이터 저장
                    List<CandleDto> daily = stockChartService.getDailyChart(ticker, initializationPeriod);
                    if (!daily.isEmpty()) {
                        historicalDataService.appendDailyData(ticker, daily);
                        log.info("{} 일봉 {}건 저장 완료", ticker, daily.size());
                    }

                    // 주봉 데이터 저장
                    List<CandleDto> weekly = stockChartService.getWeeklyChart(ticker, 156); 
                    if (!weekly.isEmpty()) {
                        historicalDataService.appendWeeklyData(ticker, weekly);
                        log.info("{} 주봉 {}건 저장 완료", ticker, weekly.size());
                    }

                    successCount++;
                    
                    Thread.sleep(2000);
                    
                } catch (Exception e) {
                    failCount++;
                    log.error("{} 데이터 수집 중 오류 발생", ticker, e);
                    
                    try {
                        Thread.sleep(5000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
            
            long duration = System.currentTimeMillis() - startTime;
            log.info("주식 데이터 초기화 완료!");
            log.info("초기화 결과 - 성공: {}개, 스킵: {}개, 실패: {}개", successCount, skipCount, failCount);
            log.info("소요 시간: {}분", duration / 1000 / 60);
            
            var cacheStats = historicalDataService.getCacheStats();
            log.info("Redis 캐시 현황: {}", cacheStats);
            
        } catch (Exception e) {
            log.error("주식 데이터 초기화 중 심각한 오류 발생", e);
        }
    }

    /**
     * 초기화 상태 확인
     */
    public InitializationStatus getInitializationStatus() {
        int cachedCount = 0;
        int totalCount = majorTickers.size();
        
        for (String ticker : majorTickers) {
            if (historicalDataService.hasCachedDailyData(ticker) && historicalDataService.hasCachedWeeklyData(ticker)) {
                cachedCount++;
            }
        }
        
        var cacheStats = historicalDataService.getCacheStats();
        
        return InitializationStatus.builder()
                .totalStocks(totalCount)
                .cachedStocks(cachedCount)
                .completionPercentage((cachedCount * 100.0) / totalCount)
                .cacheStats(cacheStats)
                .build();
    }

    /**
     * 초기화 상태 DTO
     */
    @lombok.Builder
    @lombok.Data
    public static class InitializationStatus {
        private int totalStocks;
        private int cachedStocks;
        private double completionPercentage;
        private java.util.Map<String, Object> cacheStats;
    }
} 
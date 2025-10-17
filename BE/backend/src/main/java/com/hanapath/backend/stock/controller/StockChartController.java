package com.hanapath.backend.stock.controller;

import com.hanapath.backend.stock.dto.CandleDto;
import com.hanapath.backend.stock.dto.StockInfoDto;
import com.hanapath.backend.stock.entity.StockTick;
import com.hanapath.backend.stock.repository.StockTickRepository;
import com.hanapath.backend.stock.service.StockChartService;
import com.hanapath.backend.stock.service.StockDataInitializationService;
import com.hanapath.backend.stock.service.StockHistoricalDataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/stock/chart")
public class StockChartController {

    private final StockTickRepository stockTickRepository;
    private final StockChartService stockChartService;
    private final StockHistoricalDataService historicalDataService;
    private final StockDataInitializationService initializationService;

    /**
     * 종목의 실시간 체결 데이터를 특정 시간 범위로 조회 
     */
    @GetMapping("/{ticker}")
    public List<StockTick> getChartData(@PathVariable String ticker,
                                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
                                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return stockTickRepository.findByTickerAndTimestampBetween(ticker, start, end);
    }

    /**
     * 종목의 일봉 차트 조회
     */
    @GetMapping("/{ticker}/daily")
    public List<CandleDto> getDailyChart(@PathVariable String ticker,
                                         @RequestParam(defaultValue = "30") int period) {
        int maxPeriod = Math.min(period, 2000);
        return stockChartService.getDailyChart(ticker, maxPeriod);
    }

    /**
     * 종목의 기본 정보 (현재가, 시가총액 등)를 조회
     */
    @GetMapping("/{ticker}/info")
    public StockInfoDto getStockInfo(@PathVariable String ticker) {
        return stockChartService.getStockInfo(ticker);
    }

    // -----------  캐시 관리 API -----------

    /**
     * Redis 캐시 통계 조회 (키 개수, 메모리 사용량 등)
     */
    @GetMapping("/cache/stats")
    public ResponseEntity<Map<String, Object>> getCacheStats() {
        Map<String, Object> stats = historicalDataService.getCacheStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * 종목별 데이터 초기화 진행 현황 확인
     */
    @GetMapping("/cache/status")
    public ResponseEntity<StockDataInitializationService.InitializationStatus> getInitializationStatus() {
        StockDataInitializationService.InitializationStatus status = initializationService.getInitializationStatus();
        return ResponseEntity.ok(status);
    }


    /**
     * 특정 종목 캐시 존재 여부 확인
     */
    @GetMapping("/{ticker}/cache/check")
    public ResponseEntity<Map<String, Object>> checkCache(@PathVariable String ticker) {
        boolean hasCachedData = historicalDataService.hasCachedDailyData(ticker);
        Map<String, Object> result = Map.of(
                "ticker", ticker,
                "hasCachedData", hasCachedData,
                "message", hasCachedData ? "캐시된 데이터가 있습니다." : "캐시된 데이터가 없습니다."
        );
        return ResponseEntity.ok(result);
    }

    // ----------- 다양한 기간 설정용 조회 API -----------

    /**
     * 사용자 지정 기간 일봉 조회
     */
    @GetMapping("/{ticker}/daily/extended")
    public List<CandleDto> getExtendedDailyChart(@PathVariable String ticker,
                                                 @RequestParam int period) {
        int maxPeriod = Math.min(period, 2000);
        return stockChartService.getDailyChart(ticker, maxPeriod);
    }

    /**
     * 개월 수 기준으로 일봉 조회
     */
    @GetMapping("/{ticker}/daily/months")
    public List<CandleDto> getDailyChartByMonths(@PathVariable String ticker,
                                                 @RequestParam int months) {
        int days = Math.min(months, 36) * 30;
        return stockChartService.getDailyChart(ticker, days);
    }

    /**
     * 사전 정의된 기간 키워드로 일봉 조회 (1w, 1m, 3m, 6m, 1y 등)
     */
    @GetMapping("/{ticker}/daily/predefined")
    public List<CandleDto> getPredefinedPeriodChart(@PathVariable String ticker,
                                                    @RequestParam String period) {
        int days;
        switch (period.toLowerCase()) {
            case "1w": case "1week":
                days = 7;
                break;
            case "1m": case "1month":
                days = 30;
                break;
            case "3m": case "3months":
                days = 90;
                break;
            case "6m": case "6months":
                days = 180;
                break;
            case "1y": case "1year":
                days = 365;
                break;
            default:
                days = 30; // 기본값
        }
        return stockChartService.getDailyChart(ticker, days);
    }

    // ----------- 주봉 차트 API -----------

    /**
     * 종목의 주봉 차트 조회
     */
    @GetMapping("/{ticker}/weekly")
    public List<CandleDto> getWeeklyChart(@PathVariable String ticker,
                                          @RequestParam(defaultValue = "12") int period) {
        int maxPeriod = Math.min(period, 156); 
        return stockChartService.getWeeklyChart(ticker, maxPeriod);
    }

    /**
     * 사용자 지정 기간 주봉 조회
     */
    @GetMapping("/{ticker}/weekly/extended")
    public List<CandleDto> getExtendedWeeklyChart(@PathVariable String ticker,
                                                  @RequestParam int period) {
        int maxPeriod = Math.min(period, 156);
        return stockChartService.getWeeklyChart(ticker, maxPeriod);
    }

    /**
     * 개월 수 기준으로 주봉 조회
     */
    @GetMapping("/{ticker}/weekly/months")
    public List<CandleDto> getWeeklyChartByMonths(@PathVariable String ticker,
                                                  @RequestParam int months) {
        int weeks = Math.min(months, 36) * 4;
        return stockChartService.getWeeklyChart(ticker, weeks);
    }

    /**
     * 사전 정의된 기간 키워드로 주봉 조회 (1m, 3m, 6m, 1y 등)
     */
    @GetMapping("/{ticker}/weekly/predefined")
    public List<CandleDto> getPredefinedPeriodWeeklyChart(@PathVariable String ticker,
                                                          @RequestParam String period) {
        int weeks;
        switch (period.toLowerCase()) {
            case "1m": case "1month":
                weeks = 4;  // 1개월 = 4주
                break;
            case "3m": case "3months":
                weeks = 12; // 3개월 = 12주
                break;
            case "6m": case "6months":
                weeks = 24; // 6개월 = 24주
                break;
            case "1y": case "1year":
                weeks = 52; // 1년 = 52주
                break;
            case "2y": case "2years":
                weeks = 104; // 2년 = 104주
                break;
            case "3y": case "3years":
                weeks = 156; // 3년 = 156주
                break;
            default:
                weeks = 12; // 기본값: 3개월
        }
        return stockChartService.getWeeklyChart(ticker, weeks);
    }
}
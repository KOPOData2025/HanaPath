package com.hanapath.backend.stock.service;

import com.hanapath.backend.stock.dto.CandleDto;
import com.hanapath.backend.stock.entity.StockHistoricalData;
import com.hanapath.backend.stock.repository.StockHistoricalDataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockHistoricalDataService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final StockHistoricalDataRepository stockHistoricalDataRepository;

    @Value("${app.cache.historical-data.ttl:604800}")
    private long historicalDataTtl; 

    @Value("${app.cache.stock-chart.ttl:86400}")
    private long stockChartTtl; 

    private static final String DAILY_CHART_PREFIX = "stock:daily:";
    private static final String STOCK_INFO_PREFIX = "stock:info:";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    /**
     * 일봉 데이터 조회
     */
    @SuppressWarnings("unchecked")
    public List<CandleDto> getDailyData(String ticker, int period) {
        try {
            String key = DAILY_CHART_PREFIX + ticker;
            Object data = redisTemplate.opsForValue().get(key);
            
            if (data instanceof List) {
                List<CandleDto> allData = (List<CandleDto>) data;
                
                return allData.stream()
                        .sorted((a, b) -> b.getDate().compareTo(a.getDate())) // 최신순 정렬
                        .limit(period)
                        .sorted((a, b) -> a.getDate().compareTo(b.getDate())) // 오래된 순으로 다시 정렬
                        .collect(Collectors.toList());
            }
            
            log.warn("{}의 일봉 데이터가 Redis에 없음", ticker);
            return new ArrayList<>();
        } catch (Exception e) {
            log.error("{}의 일봉 데이터 조회 실패", ticker, e);
            return new ArrayList<>();
        }
    }

    /**
     * 일봉 데이터를 Map으로 조회 
     */
    @SuppressWarnings("unchecked")
    private Map<String, CandleDto> getDailyDataMap(String ticker) {
        try {
            String key = DAILY_CHART_PREFIX + ticker;
            Object data = redisTemplate.opsForValue().get(key);
            
            if (data instanceof List) {
                List<CandleDto> dataList = (List<CandleDto>) data;
                return dataList.stream()
                        .collect(Collectors.toMap(CandleDto::getDate, candle -> candle, (existing, replacement) -> replacement));
            }
            
            return new HashMap<>();
        } catch (Exception e) {
            log.error("{}의 일봉 데이터 Map 조회 실패", ticker, e);
            return new HashMap<>();
        }
    }

    /**
     * 특정 종목의 캐시된 데이터가 있는지 확인
     */
    public boolean hasCachedDailyData(String ticker) {
        String key = DAILY_CHART_PREFIX + ticker;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    /**
     * 특정 종목의 주봉 캐시된 데이터가 있는지 확인
     */
    public boolean hasCachedWeeklyData(String ticker) {
        String key = "stock:weekly:" + ticker;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    /**
     * 전체 캐시 통계
     */
    public Map<String, Object> getCacheStats() {
        try {
            Set<String> dailyKeys = redisTemplate.keys(DAILY_CHART_PREFIX + "*");
            Set<String> infoKeys = redisTemplate.keys(STOCK_INFO_PREFIX + "*");
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("dailyDataCount", dailyKeys != null ? dailyKeys.size() : 0);
            stats.put("stockInfoCount", infoKeys != null ? infoKeys.size() : 0);
            stats.put("totalKeys", (dailyKeys != null ? dailyKeys.size() : 0) + 
                                   (infoKeys != null ? infoKeys.size() : 0));
            
            return stats;
        } catch (Exception e) {
            log.error("캐시 통계 조회 실패", e);
            return Map.of("error", e.getMessage());
        }
    }

    public void appendDailyData(String ticker, List<CandleDto> newData) {
        if (newData == null || newData.isEmpty()) return;

        String key = "stock:daily:" + ticker;
        List<CandleDto> existing = getDailyData(ticker, 1095);  
        Map<String, CandleDto> merged = new HashMap<>();

        for (CandleDto c : existing) merged.put(c.getDate(), c);
        for (CandleDto c : newData) merged.put(c.getDate(), c);

        List<CandleDto> result = new ArrayList<>(merged.values());
        result.sort(Comparator.comparing(CandleDto::getDate));

        redisTemplate.opsForValue().set(key, result, historicalDataTtl, TimeUnit.SECONDS);
        log.info("{} 일봉 누적 저장 완료 (총 {}건)", ticker, result.size());
    }

    public void appendWeeklyData(String ticker, List<CandleDto> newData) {
        String key = "stock:weekly:" + ticker;
        // 같은 방식으로 주봉 누적
        List<CandleDto> existing = getWeeklyData(ticker, 156);  

        Map<String, CandleDto> merged = new HashMap<>();
        for (CandleDto c : existing) merged.put(c.getDate(), c);
        for (CandleDto c : newData) merged.put(c.getDate(), c);

        List<CandleDto> result = new ArrayList<>(merged.values());
        result.sort(Comparator.comparing(CandleDto::getDate));

        redisTemplate.opsForValue().set(key, result, historicalDataTtl, TimeUnit.SECONDS);
        log.info("{} 주봉 누적 저장 완료 (총 {}건)", ticker, result.size());
    }

    @SuppressWarnings("unchecked")
    public List<CandleDto> getWeeklyData(String ticker, int period) {
        try {
            String key = "stock:weekly:" + ticker;
            Object data = redisTemplate.opsForValue().get(key);

            if (data instanceof List) {
                List<CandleDto> allData = (List<CandleDto>) data;

                return allData.stream()
                        .sorted((a, b) -> b.getDate().compareTo(a.getDate())) // 최신순 정렬
                        .limit(period)
                        .sorted((a, b) -> a.getDate().compareTo(b.getDate())) // 다시 오래된 순
                        .collect(Collectors.toList());
            }

            return new ArrayList<>();
        } catch (Exception e) {
            log.error("{}의 주봉 데이터 조회 실패", ticker, e);
            return new ArrayList<>();
        }
    }

    /**
     * DB에서 과거 일봉 데이터 조회 
     */
    public List<CandleDto> getHistoricalDataFromDB(String ticker, int period) {
        try {
            log.info("DB에서 {}의 과거 일봉 데이터 조회 시작 (기간: {}일)", ticker, period);
            
            Pageable pageable = PageRequest.of(0, period);
            List<StockHistoricalData> historicalDataList = stockHistoricalDataRepository
                    .findByTickerOrderByDateDesc(ticker, pageable);
            
            if (historicalDataList.isEmpty()) {
                log.warn("DB에 {}의 과거 데이터가 없음", ticker);
                return new ArrayList<>();
            }
            
            // CandleDto로 변환하고 날짜순으로 정렬
            List<CandleDto> candleList = historicalDataList.stream()
                    .map(this::convertToCandleDto)
                    .sorted(Comparator.comparing(CandleDto::getDate)) // 오래된 순으로 정렬
                    .collect(Collectors.toList());
            
            log.info("DB에서 {}의 과거 일봉 데이터 {}건 조회 성공", ticker, candleList.size());
            return candleList;
            
        } catch (Exception e) {
            log.error("DB에서 {}의 과거 일봉 데이터 조회 실패", ticker, e);
            return new ArrayList<>();
        }
    }
    
    /**
     * StockHistoricalData를 CandleDto로 변환
     */
    private CandleDto convertToCandleDto(StockHistoricalData data) {
        return CandleDto.builder()
                .ticker(data.getTicker())
                .date(data.getDate())
                .time("")
                .open(data.getOpen())
                .high(data.getHigh())
                .low(data.getLow())
                .close(data.getClose())
                .volume(data.getVolume())
                .build();
    }

} 
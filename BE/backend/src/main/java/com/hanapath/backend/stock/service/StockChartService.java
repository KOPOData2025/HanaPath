package com.hanapath.backend.stock.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanapath.backend.stock.dto.CandleDto;
import com.hanapath.backend.stock.dto.StockInfoDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class StockChartService {

    private final StockHistoricalDataService historicalDataService;

    @Value("${app.python.path:python3}")
    private String pythonPath;

    @Value("${app.chart.script.path:../../../realtime/kis_chart_api.py}")
    private String chartScriptPath;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<CandleDto> getDailyChart(String ticker, int period) {
        // 1. Redis에서 먼저 조회
        List<CandleDto> cachedData = historicalDataService.getDailyData(ticker, period);

        if (!cachedData.isEmpty()) {
            log.info("Redis에서 {}의 일봉 데이터 {}건 조회 성공", ticker, cachedData.size());

            // 요청한 기간만큼 데이터가 있으면 캐시 데이터 반환
            int minimumRequiredData = (int) Math.ceil(period * 0.8);
            if (cachedData.size() >= minimumRequiredData) {
                log.info("캐시 데이터 충분 ({}/{}일), 캐시 반환", cachedData.size(), period);
                return cachedData.subList(Math.max(0, cachedData.size() - period), cachedData.size());
            }
        }

        // 2. Redis에 데이터가 없거나 부족하면 KIS API에서 조회
        log.info("KIS API에서 {}의 일봉 데이터 조회 시작 (기간: {}일)", ticker, period);

        // 요청한 기간만큼 데이터 수집 
        int extendedPeriod = Math.min(period, 2000);
        List<CandleDto> apiData = getChartDataFromAPI(ticker, "daily", extendedPeriod);

        if (!apiData.isEmpty()) {
            // 3. 새로 조회한 데이터를 Redis에 저장
            historicalDataService.appendDailyData(ticker, apiData); // 누적 저장

            // 4. 요청한 기간만큼 데이터 반환
            int returnSize = Math.min(period, apiData.size());
            return apiData.subList(Math.max(0, apiData.size() - returnSize), apiData.size());
        }

        // 5. DB에서 과거 데이터 추가 조회
        if (period >= 365) {
            log.info("1년 이상 요청으로 DB에서 {}의 과거 데이터 추가 조회", ticker);
            List<CandleDto> historicalData = historicalDataService.getHistoricalDataFromDB(ticker, period);
            
            if (!historicalData.isEmpty()) {
                log.info("DB에서 {}의 과거 데이터 {}건 조회 성공", ticker, historicalData.size());
                
                // Redis 데이터와 DB 데이터를 합치기 (중복 제거)
                List<CandleDto> combinedData = new ArrayList<>();
                Set<String> existingDates = new HashSet<>();
                
                // Redis 데이터 먼저 추가 (최신 데이터)
                for (CandleDto candle : cachedData) {
                    if (!existingDates.contains(candle.getDate())) {
                        combinedData.add(candle);
                        existingDates.add(candle.getDate());
                    }
                }
                
                // DB 데이터 추가 (과거 데이터, 중복 제거)
                for (CandleDto candle : historicalData) {
                    if (!existingDates.contains(candle.getDate())) {
                        combinedData.add(candle);
                        existingDates.add(candle.getDate());
                    }
                }
                
                // 날짜순으로 정렬
                combinedData.sort(Comparator.comparing(CandleDto::getDate));
                
                // 요청한 기간만큼 반환 (최신 데이터 기준)
                int returnSize = Math.min(period, combinedData.size());
                return combinedData.subList(Math.max(0, combinedData.size() - returnSize), combinedData.size());
            }
        }

        return new ArrayList<>();
    }

    public StockInfoDto getStockInfo(String ticker) {
        // 최대 3번 재시도
        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                log.info("종목 정보 조회 시도 {}: {}", attempt, ticker);
                StockInfoDto result = getStockInfoData(ticker);
                if (result != null) {
                    log.info("종목 정보 조회 성공: {}", ticker);
                    return result;
                }

                if (attempt < 3) {
                    log.warn("종목 정보 조회 실패, {}초 후 재시도: {}", 2 * attempt, ticker);
                    Thread.sleep(2000 * attempt); // 점진적 대기
                }
            } catch (Exception e) {
                log.error("종목 정보 조회 중 오류 (시도 {}): {}", attempt, ticker, e);
                if (attempt < 3) {
                    try {
                        Thread.sleep(2000 * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }

        // 모든 시도 실패 시 기본 정보로 대체
        log.warn("종목 정보 조회 최종 실패, 기본 정보 사용: {}", ticker);
        return StockInfoDto.builder()
                .ticker(ticker)
                .name(getStockNameByCode(ticker))
                .currentPrice(0)
                .changeAmount(0)
                .changeRate(0.0)
                .openPrice(0)
                .highPrice(0)
                .lowPrice(0)
                .volume(0L)
                .tradingValue(0L)
                .marketCap(0L)
                .per(0.0)
                .pbr(0.0)
                .eps(0)
                .bps(0)
                .sector("정보 없음")
                .listingShares(0L)
                .build();
    }

    /**
     * KIS API에서 차트 데이터 직접 조회
     */
    private List<CandleDto> getChartDataFromAPI(String ticker, String chartType, int period) {
        try {
            String projectRoot = System.getProperty("user.dir");
            String realtimeDir = projectRoot + "/realtime";
            String scriptPath = realtimeDir + "/kis_chart_api.py";

            log.info("현재 작업 디렉토리: {}", projectRoot);
            log.info("Realtime 디렉토리: {}", realtimeDir);
            log.info("Python 스크립트 실행: python3 {} {} {} {}", scriptPath, ticker, chartType, period);

            java.io.File scriptFile = new java.io.File(scriptPath);
            java.io.File realtimeDirFile = new java.io.File(realtimeDir);

            if (!realtimeDirFile.exists()) {
                log.error("Realtime 디렉토리를 찾을 수 없음: {}", realtimeDir);
                return new ArrayList<>();
            }

            if (!scriptFile.exists()) {
                log.error("Python 스크립트를 찾을 수 없음: {}", scriptPath);
                return new ArrayList<>();
            }

            ProcessBuilder pb = new ProcessBuilder(
                    "/bin/bash", "-c",
                    String.format("cd %s && source venv/bin/activate && python kis_chart_api.py %s %s %d",
                            realtimeDir, ticker, chartType, period)
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();

            StringBuilder output = new StringBuilder();

            boolean finished = process.waitFor(10, TimeUnit.SECONDS);

            if (!finished) {
                log.error("Python 스크립트 실행 타임아웃 (10초)");
                process.destroyForcibly();
                return new ArrayList<>();
            }

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            int exitCode = process.exitValue();

            if (exitCode != 0) {
                log.error("Python 스크립트 실행 실패. Exit code: {}, Output: {}", exitCode, output.toString());
                return new ArrayList<>();
            }

            return parseChartOutput(output.toString(), ticker);

        } catch (Exception e) {
            log.error("차트 데이터 조회 중 오류 발생", e);
            return new ArrayList<>();
        }
    }

    private List<CandleDto> parseChartOutput(String output, String ticker) {
        List<CandleDto> candles = new ArrayList<>();

        try {
            String[] lines = output.split("\n");
            for (String line : lines) {
                if (line.trim().startsWith("[") || line.trim().startsWith("{")) {
                    JsonNode jsonNode = objectMapper.readTree(line.trim());

                    if (jsonNode.isArray()) {
                        for (JsonNode item : jsonNode) {
                            CandleDto candle = parseCandle(item, ticker);
                            if (candle != null) {
                                candles.add(candle);
                            }
                        }
                    } else {
                        CandleDto candle = parseCandle(jsonNode, ticker);
                        if (candle != null) {
                            candles.add(candle);
                        }
                    }
                    break; 
                }
            }
        } catch (JsonProcessingException e) {
            log.error("차트 데이터 파싱 오류", e);
        }

        return candles;
    }

    private CandleDto parseCandle(JsonNode node, String ticker) {
        try {
            return CandleDto.builder()
                    .ticker(ticker)
                    .date(node.get("date").asText())
                    .time(node.has("time") ? node.get("time").asText() : "")
                    .open(node.get("open").asInt())
                    .high(node.get("high").asInt())
                    .low(node.get("low").asInt())
                    .close(node.get("close").asInt())
                    .volume(node.get("volume").asLong())
                    .build();
        } catch (Exception e) {
            log.error("캔들 데이터 파싱 오류: {}", node.toString(), e);
            return null;
        }
    }

    private StockInfoDto getStockInfoData(String ticker) {
        try {
            String realtimeDir = System.getProperty("user.dir") + "/realtime";

            log.info("종목 정보 조회: python {} info", ticker);

            ProcessBuilder pb = new ProcessBuilder(
                    "/bin/bash", "-c",
                    String.format("cd %s && source venv/bin/activate && python kis_chart_api.py %s info dummy",
                            realtimeDir, ticker)
            );

            pb.redirectErrorStream(true);
            Process process = pb.start();

            StringBuilder output = new StringBuilder();

            boolean finished = process.waitFor(10, TimeUnit.SECONDS);

            if (!finished) {
                log.error("Python 스크립트 실행 타임아웃 (10초)");
                process.destroyForcibly();
                return null;
            }

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            int exitCode = process.exitValue();

            if (exitCode != 0) {
                log.error("Python 스크립트 실행 실패. Exit code: {}, Output: {}", exitCode, output.toString());
                return null;
            }

            return parseStockInfoOutput(output.toString(), ticker);

        } catch (Exception e) {
            log.error("종목 정보 조회 중 오류 발생", e);
            return null;
        }
    }

    private StockInfoDto parseStockInfoOutput(String output, String ticker) {
        try {
            String[] lines = output.split("\n");
            for (String line : lines) {
                if (line.trim().startsWith("{")) {
                    JsonNode jsonNode = objectMapper.readTree(line.trim());
                    return parseStockInfo(jsonNode);
                }
            }
        } catch (JsonProcessingException e) {
            log.error("종목 정보 파싱 오류", e);
        }
        return null;
    }

    private StockInfoDto parseStockInfo(JsonNode node) {
        try {
            String ticker = node.get("ticker").asText();
            String name = node.get("name").asText();

            // 종목명이 비어있으면 기본 종목명 설정
            if (name == null || name.trim().isEmpty()) {
                name = getStockNameByCode(ticker);
            }

            return StockInfoDto.builder()
                    .ticker(ticker)
                    .name(name)
                    .currentPrice(getIntValue(node, "currentPrice"))
                    .changeAmount(getIntValue(node, "changeAmount"))
                    .changeRate(getDoubleValue(node, "changeRate"))
                    .openPrice(getIntValue(node, "openPrice"))
                    .highPrice(getIntValue(node, "highPrice"))
                    .lowPrice(getIntValue(node, "lowPrice"))
                    .volume(getLongValue(node, "volume"))
                    .tradingValue(getLongValue(node, "tradingValue"))
                    .marketCap(getLongValue(node, "marketCap"))
                    .capital(getLongValue(node, "capital"))
                    .per(getDoubleValue(node, "per"))
                    .pbr(getDoubleValue(node, "pbr"))
                    .eps(getIntValue(node, "eps"))
                    .bps(getIntValue(node, "bps"))
                    .sector(getStringValue(node, "sector"))
                    .listingShares(getLongValue(node, "listingShares"))
                    .build();
        } catch (Exception e) {
            log.error("종목 정보 파싱 오류: {}", node.toString(), e);
            return null;
        }
    }

    /**
     * 종목 코드로 종목명 조회하는 메서드
     */
    private String getStockNameByCode(String code) {
        java.util.Map<String, String> stockMap = new java.util.HashMap<>();
        stockMap.put("005930", "삼성전자");
        stockMap.put("000660", "SK하이닉스");
        stockMap.put("373220", "LG에너지솔루션");
        stockMap.put("207940", "삼성바이오로직스");
        stockMap.put("035420", "NAVER");
        stockMap.put("006400", "삼성SDI");
        stockMap.put("005380", "현대차");
        stockMap.put("035720", "카카오");
        stockMap.put("005490", "POSCO홀딩스");
        stockMap.put("000270", "기아");
        stockMap.put("051910", "LG화학");
        stockMap.put("068270", "셀트리온");
        stockMap.put("012450", "한화에어로스페이스");
        stockMap.put("011200", "HMM");
        stockMap.put("003490", "대한항공");
        stockMap.put("096770", "SK이노베이션");
        stockMap.put("012330", "현대모비스");
        stockMap.put("090430", "아모레퍼시픽");
        stockMap.put("033780", "KT&G");
        stockMap.put("066570", "LG전자");
        stockMap.put("034020", "두산에너빌리티");
        stockMap.put("377300", "카카오페이");
        stockMap.put("259960", "크래프톤");
        stockMap.put("017670", "SK텔레콤");
        stockMap.put("015760", "한국전력");
        stockMap.put("097950", "CJ제일제당");
        stockMap.put("383220", "F&F");
        stockMap.put("030000", "제일기획");
        stockMap.put("086790", "하나금융지주");
        stockMap.put("005830", "DB손해보험");
        stockMap.put("105560", "KB금융");
        stockMap.put("055550", "신한지주");
        stockMap.put("009150", "삼성전기");
        stockMap.put("247540", "에코프로비엠");
        stockMap.put("000880", "한화");
        stockMap.put("004020", "현대제철");
        stockMap.put("009830", "한화솔루션");
        stockMap.put("086280", "현대글로비스");
        stockMap.put("326030", "SK바이오팜");
        stockMap.put("078930", "GS");
        stockMap.put("010950", "S-Oil");
        stockMap.put("267250", "HD현대");
        stockMap.put("241560", "두산밥캣");
        stockMap.put("000810", "삼성화재");
        stockMap.put("005940", "NH투자증권");
        stockMap.put("003550", "LG");
        stockMap.put("017800", "현대엘리베이터");
        stockMap.put("006800", "미래에셋증권");
        stockMap.put("089470", "HDC현대EP");
        stockMap.put("000100", "유한양행");
        stockMap.put("003230", "삼양식품");
        stockMap.put("028050", "삼성E&A");
        stockMap.put("029780", "삼성카드");
        stockMap.put("042660", "한화오션");
        stockMap.put("006360", "GS건설");
        stockMap.put("001450", "현대해상");
        stockMap.put("032640", "LG유플러스");
        stockMap.put("034730", "SK");
        stockMap.put("002790", "아모레퍼시픽홀딩스");
        stockMap.put("034310", "NICE");
        stockMap.put("000720", "현대건설");
        stockMap.put("069620", "대웅제약");
        stockMap.put("006280", "녹십자");
        stockMap.put("010060", "OCI홀딩스");
        stockMap.put("021240", "코웨이");
        stockMap.put("047050", "포스코인터내셔널");
        stockMap.put("073240", "금호타이어");
        stockMap.put("282330", "BGF리테일");
        stockMap.put("011780", "금호석유화학");
        stockMap.put("014680", "한솔케미칼");
        stockMap.put("042700", "한미반도체");
        stockMap.put("007310", "오뚜기");
        stockMap.put("000990", "DB하이텍");
        stockMap.put("016360", "삼성증권");
        stockMap.put("272450", "진에어");
        stockMap.put("145720", "덴티움");
        stockMap.put("181710", "NHN");
        stockMap.put("036570", "엔씨소프트");
        stockMap.put("251270", "넷마블");
        stockMap.put("001440", "대한전선");
        stockMap.put("030200", "KT");
        stockMap.put("034220", "LG디스플레이");
        stockMap.put("138040", "메리츠금융지주");
        stockMap.put("316140", "우리금융지주");
        stockMap.put("138930", "BNK금융지주");
        stockMap.put("139130", "iM금융지주");
        stockMap.put("004990", "롯데지주");
        stockMap.put("011170", "롯데케미칼");
        stockMap.put("047810", "한국항공우주");
        stockMap.put("006260", "LS");
        stockMap.put("267260", "HD현대일렉트릭");
        stockMap.put("272210", "한화시스템");
        stockMap.put("002380", "KCC");
        stockMap.put("041510", "에스엠");
        stockMap.put("035900", "JYP Ent.");
        stockMap.put("086520", "에코프로");
        stockMap.put("000640", "동아쏘시오홀딩스");
        stockMap.put("079550", "LIG넥스원");
        stockMap.put("103140", "풍산");
        stockMap.put("009450", "경동나비엔");

        return stockMap.getOrDefault(code, code + " 종목");
    }

    public List<CandleDto> getWeeklyChart(String ticker, int period) {
        // 1. Redis에서 기존 데이터 조회
        List<CandleDto> cachedData = historicalDataService.getWeeklyData(ticker, period);

        // 2. Redis에 데이터가 있는 경우 반환
        int minimumRequiredData = (int) Math.ceil(period * 0.8);
        if (!cachedData.isEmpty() && cachedData.size() >= minimumRequiredData) {
            log.info("캐시된 주봉 데이터 사용: {}/{}주", cachedData.size(), period);
            return cachedData.subList(Math.max(0, cachedData.size() - period), cachedData.size());
        }

        // 3. 부족한 경우 Python 통해 API 조회
        log.info("KIS API에서 {}의 주봉 데이터 조회 시작 ({}주)", ticker, period);
        // 주 단위를 일 단위로 변환 
        int daysForWeeks = Math.min(period * 7, 365);
        List<CandleDto> apiData = getChartDataFromAPI(ticker, "weekly", daysForWeeks);

        // 4. Redis에 누적 저장
        if (!apiData.isEmpty()) {
            historicalDataService.appendWeeklyData(ticker, apiData);
        }

        // 5. 최종 결과 반환 (최신 기준 period만큼)
        List<CandleDto> finalData = historicalDataService.getWeeklyData(ticker, period);
        return finalData.subList(Math.max(0, finalData.size() - period), finalData.size());
    }

    private int getIntValue(JsonNode node, String key) {
        return node.has(key) ? node.get(key).asInt() : 0;
    }

    private long getLongValue(JsonNode node, String key) {
        return node.has(key) ? node.get(key).asLong() : 0L;
    }

    private double getDoubleValue(JsonNode node, String key) {
        return node.has(key) ? node.get(key).asDouble() : 0.0;
    }

    private String getStringValue(JsonNode node, String key) {
        return node.has(key) ? node.get(key).asText() : "정보 없음";
    }
} 
package com.hanapath.backend.stock.service;

import com.hanapath.backend.stock.entity.StockHistoricalData;
import com.hanapath.backend.stock.entity.StockMaster;
import com.hanapath.backend.stock.repository.StockHistoricalDataRepository;
import com.hanapath.backend.stock.repository.StockMasterRepository;
import com.hanapath.backend.stock.util.StockNameMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CsvDataImportService {

    private final StockHistoricalDataRepository historicalDataRepository;
    private final StockMasterRepository stockMasterRepository;
    private final StockNameMapper stockNameMapper;
    
    @Value("${app.paths.csv-file}")
    private String csvFilePath;
    
    private static final DateTimeFormatter CSV_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy/MM/dd");
    private static final DateTimeFormatter DB_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");
    

    public void importHistoricalDataFromCsv() {
        log.info("CSV 파일에서 히스토리 데이터 임포트 시작: {}", csvFilePath);
        
        // 파일 존재 확인
        java.io.File csvFile = new java.io.File(csvFilePath);
        if (!csvFile.exists()) {
            log.error("CSV 파일을 찾을 수 없습니다: {}", csvFilePath);
            throw new RuntimeException("CSV 파일을 찾을 수 없습니다: " + csvFilePath);
        }
        log.info("CSV 파일 확인 완료: {} (크기: {} bytes)", csvFilePath, csvFile.length());
        
        List<StockHistoricalData> batchData = new ArrayList<>();
        int totalProcessed = 0;
        int totalSaved = 0;
        int duplicateSkipped = 0;
        int batchSize = 100; // 더 작은 배치로 트랜잭션 안정성 향상

        try (BufferedReader reader = new BufferedReader(new FileReader(csvFilePath))) {
            String line;
            boolean isHeader = true;
            
            while ((line = reader.readLine()) != null) {
                if (isHeader) {
                    log.info("CSV 헤더: {}", line);
                    isHeader = false;
                    continue; // 헤더 스킵: date,close,open,high,low,volume,ticker
                }
                
                String[] columns = line.split(",");
                if (columns.length < 7) {
                    log.warn("잘못된 데이터 형식 (컬럼 부족): {}", line);
                    continue;
                }
                
                try {
                    // CSV 데이터 파싱 (순서: date,close,open,high,low,volume,ticker)
                    String csvDate = columns[0].trim();      
                    String closeStr = columns[1].trim();    
                    String openStr = columns[2].trim();      
                    String highStr = columns[3].trim();      
                    String lowStr = columns[4].trim();      
                    String volumeStr = columns[5].trim();    
                    String ticker = columns[6].trim();       
                    
                    // 날짜 형식 변환
                    LocalDate date = LocalDate.parse(csvDate, CSV_DATE_FORMAT);
                    String dbDate = date.format(DB_DATE_FORMAT);
                    
                    // 중복 데이터 체크
                    if (historicalDataRepository.findByTickerAndDate(ticker, dbDate).isPresent()) {
                        duplicateSkipped++;
                        continue; // 이미 존재하는 데이터 스킵
                    }
                    
                    // StockMaster 확인 및 생성
                    StockMaster stockMaster = ensureStockMaster(ticker);
                    
                    // StockHistoricalData 생성
                    StockHistoricalData data = StockHistoricalData.builder()
                            .stockMaster(stockMaster)
                            .ticker(ticker)
                            .date(dbDate)
                            .open(Integer.parseInt(openStr))
                            .high(Integer.parseInt(highStr))
                            .low(Integer.parseInt(lowStr))
                            .close(Integer.parseInt(closeStr))
                            .volume(Long.parseLong(volumeStr))
                            .build();
                    
                    batchData.add(data);
                    totalProcessed++;
                    
                    // 배치 저장 (트랜잭션 분리)
                    if (batchData.size() >= batchSize) {
                        saveBatch(batchData);
                        totalSaved += batchData.size();
                        log.info("배치 저장 완료: {}건 (총 처리: {}건, 저장: {}건, 중복 스킵: {}건)", 
                                batchData.size(), totalProcessed, totalSaved, duplicateSkipped);
                        batchData.clear();
                    }
                    
                } catch (Exception e) {
                    log.error("데이터 처리 실패: {} - {}", line, e.getMessage());
                }
            }
            
            // 마지막 배치 저장
            if (!batchData.isEmpty()) {
                saveBatch(batchData);
                totalSaved += batchData.size();
                log.info("최종 배치 저장 완료: {}건", batchData.size());
            }
            
        } catch (IOException e) {
            log.error("CSV 파일 읽기 실패: {}", e.getMessage());
            throw new RuntimeException("CSV 파일 임포트 실패", e);
        }
        
        log.info("CSV 임포트 완료 - 총 처리: {}건, 저장: {}건, 중복 스킵: {}건", 
                totalProcessed, totalSaved, duplicateSkipped);
    }
    
    /**
     * 배치 데이터를 별도 트랜잭션으로 저장
     */
    @Transactional
    public void saveBatch(List<StockHistoricalData> batchData) {
        try {
            historicalDataRepository.saveAll(batchData);
            log.debug("배치 저장 성공: {}건", batchData.size());
        } catch (Exception e) {
            log.error("배치 저장 실패: {}건 - {}", batchData.size(), e.getMessage());
            throw e;
        }
    }
    
    private StockMaster ensureStockMaster(String ticker) {
        Optional<StockMaster> existing = stockMasterRepository.findByTicker(ticker);
        if (existing.isPresent()) {
            return existing.get();
        }
        
        // 종목명 매핑 
        String stockName = stockNameMapper.getStockNameByCode(ticker);
        
        StockMaster newStock = stockMasterRepository.save(StockMaster.builder()
                .ticker(ticker)
                .name(stockName)
                .build());
        
        log.info("새 종목 등록: {} - {}", ticker, stockName);
        return newStock;
    }
}

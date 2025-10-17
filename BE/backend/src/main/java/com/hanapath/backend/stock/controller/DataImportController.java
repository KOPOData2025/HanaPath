package com.hanapath.backend.stock.controller;

import com.hanapath.backend.stock.service.CsvDataImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/data")
@RequiredArgsConstructor
@Slf4j
public class DataImportController {
    
    private final CsvDataImportService csvDataImportService;
    
    @Value("${app.paths.csv-file}")
    private String csvFilePath;
    
    @PostMapping("/import-csv")
    public ResponseEntity<Map<String, String>> importCsvData() {
        try {
            log.info("CSV 데이터 임포트 시작");
            csvDataImportService.importHistoricalDataFromCsv();
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "CSV 데이터 임포트 완료"
            ));
        } catch (Exception e) {
            log.error("CSV 임포트 실패", e);
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", "임포트 실패: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/import-status")
    public ResponseEntity<Map<String, Object>> getImportStatus() {
        // 임포트 상태 확인용 
        return ResponseEntity.ok(Map.of(
            "status", "ready",
            "csvPath", csvFilePath
        ));
    }
}




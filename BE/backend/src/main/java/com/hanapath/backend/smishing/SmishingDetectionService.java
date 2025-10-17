package com.hanapath.backend.smishing;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;

@Service
@Slf4j
public class SmishingDetectionService {

    @Value("${smishing.service.url}")
    private String smishingServiceUrl;

    private final RestTemplate restTemplate;

    public SmishingDetectionService() {
        this.restTemplate = new RestTemplate();
    }

    public SmishingDetectionResponse detectSmishing(String message) {
        try {
            log.info("스미싱 탐지 요청 시작");
            log.info("입력 메시지: {}", message.substring(0, Math.min(message.length(), 50)) + "...");

            // Flask 서비스에 요청
            String url = smishingServiceUrl + "/detect";
            log.info("Flask 서비스 URL: {}", url);
            
            SmishingDetectionRequest request = SmishingDetectionRequest.builder()
                    .message(message)
                    .build();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<SmishingDetectionRequest> entity = new HttpEntity<>(request, headers);
            log.info("Flask 서비스로 요청 전송 중...");

            ResponseEntity<SmishingDetectionResponse> response = restTemplate.postForEntity(
                    url, entity, SmishingDetectionResponse.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                log.info("스미싱 탐지 성공");
                log.info("원시 응답 데이터: {}", response.getBody());
                log.info("결과 - isSmishing: {}, confidence: {}%", 
                        response.getBody().isSmishing(), response.getBody().getConfidence());
                log.info("이유: {}", response.getBody().getReasons());
                log.info("권장사항: {}", response.getBody().getSuggestions());
                return response.getBody();
            } else {
                log.error("스미싱 탐지 서비스 응답 오류: {}", response.getStatusCode());
                return createErrorResponse("스미싱 탐지 서비스 응답 오류");
            }

        } catch (Exception e) {
            log.error("스미싱 탐지 서비스 호출 중 오류 발생", e);
            return createErrorResponse("스미싱 탐지 서비스에 연결할 수 없습니다: " + e.getMessage());
        }
    }

    public boolean isServiceHealthy() {
        try {
            String url = smishingServiceUrl + "/health";
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            log.error("스미싱 탐지 서비스 상태 확인 중 오류 발생", e);
            return false;
        }
    }

    private SmishingDetectionResponse createErrorResponse(String errorMessage) {
        return SmishingDetectionResponse.builder()
                .isSmishing(false)
                .confidence(0.0)
                .reasons(Arrays.asList("서비스 오류가 발생했습니다"))
                .suggestions(Arrays.asList("잠시 후 다시 시도해주세요"))
                .error(errorMessage)
                .build();
    }
}

package com.hanapath.backend.smishing;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/smishing")
@RequiredArgsConstructor
@CrossOrigin(origins = {"${app.urls.frontend}", "${app.urls.frontend-alt}"})
public class SmishingDetectionController {

    private final SmishingDetectionService smishingDetectionService;

    @PostMapping("/detect")
    public ResponseEntity<SmishingDetectionResponse> detectSmishing(
            @RequestBody SmishingDetectionRequest request) {
        try {
            System.out.println("스미싱 탐지 API 호출됨");
            System.out.println("요청 메시지: " + request.getMessage().substring(0, Math.min(request.getMessage().length(), 50)) + "...");
            
            SmishingDetectionResponse response = smishingDetectionService.detectSmishing(request.getMessage());
            
            System.out.println("스미싱 탐지 완료");
            System.out.println("결과: " + (response.isSmishing() ? "스미싱 의심" : "정상 메시지"));
            System.out.println("신뢰도: " + response.getConfidence() + "%");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("스미싱 탐지 중 오류 발생: " + e.getMessage());
            // 에러 발생 시 기본 응답 반환
            SmishingDetectionResponse errorResponse = SmishingDetectionResponse.builder()
                    .isSmishing(false)
                    .confidence(0.0)
                    .error("스미싱 탐지 서비스에 일시적인 문제가 발생했습니다.")
                    .build();
            return ResponseEntity.ok(errorResponse);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        try {
            boolean isHealthy = smishingDetectionService.isServiceHealthy();
            if (isHealthy) {
                return ResponseEntity.ok("스미싱 탐지 서비스가 정상적으로 작동 중입니다.");
            } else {
                return ResponseEntity.status(503).body("스미싱 탐지 서비스에 연결할 수 없습니다.");
            }
        } catch (Exception e) {
            return ResponseEntity.status(503).body("스미싱 탐지 서비스 상태를 확인할 수 없습니다.");
        }
    }
}

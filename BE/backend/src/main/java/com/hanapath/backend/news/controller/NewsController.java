package com.hanapath.backend.news.controller;

import com.hanapath.backend.news.dto.NewsDto;
import com.hanapath.backend.news.service.NewsService;
import com.hanapath.backend.hanamoney.service.HanaMoneyIntegrationService;
import com.hanapath.backend.hanamoney.dto.HanaMoneyTransactionDto;
import com.hanapath.backend.hanamoney.repository.HanaMoneyTransactionRepository;
import com.hanapath.backend.users.util.JwtUtil;
import com.hanapath.backend.users.entity.ExperienceEvent;
import com.hanapath.backend.users.service.ExperienceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
@Slf4j
public class NewsController {

    private final NewsService newsService;
    private final HanaMoneyIntegrationService hanaMoneyIntegrationService;
    private final HanaMoneyTransactionRepository hanaMoneyTransactionRepository;
    private final JwtUtil jwtUtil;
    private final ExperienceService experienceService;

    @GetMapping("/recent")
    public List<NewsDto> getRecentNews() {
        return newsService.getRecentNews();
    }

    @GetMapping("/{id}")
    public ResponseEntity<NewsDto> getNewsById(@PathVariable String id, jakarta.servlet.http.HttpServletRequest request) {
        return newsService.getNewsById(id)
                .map(newsDto -> {
                    // 로그인한 사용자의 경우 이미 적립했는지 확인
                    try {
                        String authHeader = request.getHeader("Authorization");
                        log.info("Authorization 헤더 확인: {}", authHeader != null ? "헤더 있음" : "헤더 없음");
                        
                        if (authHeader != null && authHeader.startsWith("Bearer ")) {
                            String jwt = authHeader.substring(7);
                            Long userId = jwtUtil.extractUserId(jwt);
                            log.info("JWT 토큰에서 userId 추출: {}", userId);
                            
                            if (userId != null) {
                                String referenceId = "NEWS_" + id;
                                boolean isRewarded = hanaMoneyTransactionRepository.existsEarnTransactionByUserIdAndReferenceId(
                                    userId, referenceId);
                                log.info("뉴스 적립 상태 확인: newsId={}, userId={}, referenceId={}, isRewarded={}", id, userId, referenceId, isRewarded);
                                newsDto.setIsRewarded(isRewarded);
                            } else {
                                log.warn("userId 추출 실패");
                            }
                        } else {
                            log.warn("Authorization 헤더가 없거나 Bearer 형식이 아님: {}", authHeader);
                        }
                    } catch (Exception e) {
                        log.warn("뉴스 적립 상태 확인 실패: newsId={}, error={}", id, e.getMessage());
                    }
                    
                    return ResponseEntity.ok(newsDto);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 뉴스 읽기 하나머니 적립
     */
    @PostMapping("/{id}/reward")
    public ResponseEntity<HanaMoneyTransactionDto> processNewsReadReward(
            @PathVariable String id,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).build();
            }

            String jwt = authHeader.substring(7);
            Long userId = jwtUtil.extractUserId(jwt);
            
            if (userId == null) {
                return ResponseEntity.status(401).build();
            }

            HanaMoneyTransactionDto transaction = hanaMoneyIntegrationService.rewardNewsRead(userId, id);
            try {
                experienceService.awardExp(userId, ExperienceEvent.ExperienceType.NEWS_READ, id);
            } catch (Exception e) {
                log.warn("뉴스 EXP 적립 실패: newsId={}, error={}", id, e.getMessage());
            }
            return ResponseEntity.ok(transaction);
        } catch (Exception e) {
            log.error("뉴스 읽기 보상 처리 실패: newsId={}, error={}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
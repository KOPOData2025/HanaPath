package com.hanapath.backend.hanamoney.controller;

import com.hanapath.backend.hanamoney.dto.HanaMoneyDto;
import com.hanapath.backend.hanamoney.dto.HanaMoneyRequestDto;
import com.hanapath.backend.hanamoney.dto.HanaMoneyTransactionDto;
import com.hanapath.backend.hanamoney.dto.HanaMoneyTransferRequestDto;
import com.hanapath.backend.hanamoney.service.HanaMoneyService;
import com.hanapath.backend.users.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/hanamoney")
@RequiredArgsConstructor
@Slf4j
public class HanaMoneyController {

    private final HanaMoneyService hanaMoneyService;
    private final JwtUtil jwtUtil;

    private Long getCurrentUserId(jakarta.servlet.http.HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalStateException("인증 토큰이 없습니다.");
        }

        String jwt = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(jwt);
        
        if (userId == null) {
            throw new IllegalStateException("사용자 ID를 추출할 수 없습니다.");
        }
        
        return userId;
    }

    /**
     * 현재 사용자의 하나머니 정보 조회
     */
    @GetMapping("/my")
    public ResponseEntity<HanaMoneyDto> getMyHanaMoney(jakarta.servlet.http.HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            HanaMoneyDto hanaMoney = hanaMoneyService.getHanaMoneyByUserId(userId);
            return ResponseEntity.ok(hanaMoney);
        } catch (Exception e) {
            log.error("하나머니 조회 실패: error={}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 현재 사용자의 거래 내역 조회 (페이징)
     */
    @GetMapping("/my/transactions")
    public ResponseEntity<Page<HanaMoneyTransactionDto>> getMyTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            Pageable pageable = PageRequest.of(page, size);
            Page<HanaMoneyTransactionDto> transactions = hanaMoneyService.getTransactionsByUserId(userId, pageable);
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            log.error("거래 내역 조회 실패: error={}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 현재 사용자의 거래 내역 조회 (날짜 범위)
     */
    @GetMapping("/my/transactions/range")
    public ResponseEntity<List<HanaMoneyTransactionDto>> getMyTransactionsByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            LocalDateTime start = LocalDateTime.parse(startDate);
            LocalDateTime end = LocalDateTime.parse(endDate);
            List<HanaMoneyTransactionDto> transactions = hanaMoneyService.getTransactionsByUserIdAndDateRange(userId, start, end);
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            log.error("날짜 범위 거래 내역 조회 실패: error={}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 하나머니 거래 처리 (적립/사용/이체)
     */
    @PostMapping("/transaction")
    public ResponseEntity<HanaMoneyTransactionDto> processTransaction(@RequestBody HanaMoneyRequestDto requestDto) {
        try {
            HanaMoneyTransactionDto transaction = hanaMoneyService.processTransaction(requestDto);
            return ResponseEntity.ok(transaction);
        } catch (IllegalArgumentException e) {
            log.error("거래 처리 실패 (잘못된 요청): error={}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            log.error("거래 처리 실패 (상태 오류): error={}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("거래 처리 실패: error={}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 출석 체크 적립
     */
    @PostMapping("/attendance")
    public ResponseEntity<HanaMoneyTransactionDto> processAttendanceCheck(jakarta.servlet.http.HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            HanaMoneyTransactionDto transaction = hanaMoneyService.processAttendanceCheck(userId);
            return ResponseEntity.ok(transaction);
        } catch (IllegalStateException e) {
            log.error("출석 체크 실패: error={}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("출석 체크 처리 실패: error={}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 퀴즈 정답 적립
     */
    @PostMapping("/quiz-reward")
    public ResponseEntity<HanaMoneyTransactionDto> processQuizReward(
            @RequestParam String quizId,
            @RequestParam boolean isCorrect,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            HanaMoneyTransactionDto transaction = hanaMoneyService.processQuizReward(userId, quizId, isCorrect);
            return ResponseEntity.ok(transaction);
        } catch (IllegalArgumentException e) {
            log.error("퀴즈 보상 처리 실패: quizId={}, error={}", quizId, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("퀴즈 보상 처리 실패: quizId={}, error={}", quizId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 뉴스 읽기 적립
     */
    @PostMapping("/news-reward")
    public ResponseEntity<HanaMoneyTransactionDto> processNewsReadReward(
            @RequestParam String newsId,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            HanaMoneyTransactionDto transaction = hanaMoneyService.processNewsReadReward(userId, newsId);
            return ResponseEntity.ok(transaction);
        } catch (Exception e) {
            log.error("뉴스 읽기 보상 처리 실패: newsId={}, error={}", newsId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 스토어 상품 구매
     */
    @PostMapping("/store-purchase")
    public ResponseEntity<HanaMoneyTransactionDto> processStorePurchase(
            @RequestParam String productId,
            @RequestParam String price,
            @RequestParam String productName,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            HanaMoneyTransactionDto transaction = hanaMoneyService.processStorePurchase(
                    userId, productId, new java.math.BigDecimal(price), productName);
            return ResponseEntity.ok(transaction);
        } catch (Exception e) {
            log.error("스토어 구매 처리 실패: productId={}, error={}", productId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 계좌 이체 처리
     */
    @PostMapping("/transfer")
    public ResponseEntity<HanaMoneyTransactionDto> processAccountTransfer(
            @RequestBody HanaMoneyTransferRequestDto transferRequest,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            transferRequest.setUserId(userId); // 현재 사용자 ID로 설정
            HanaMoneyTransactionDto transaction = hanaMoneyService.processAccountTransfer(transferRequest);
            return ResponseEntity.ok(transaction);
        } catch (IllegalArgumentException e) {
            log.error("계좌 이체 실패 (잘못된 요청): error={}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("계좌 이체 처리 실패: error={}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 월별 통계 조회
     */
    @GetMapping("/stats/monthly")
    public ResponseEntity<HanaMoneyService.HanaMoneyMonthlyStatsDto> getMonthlyStats(
            @RequestParam int year,
            @RequestParam int month,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            HanaMoneyService.HanaMoneyMonthlyStatsDto stats = hanaMoneyService.getMonthlyStats(userId, year, month);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("월별 통계 조회 실패: year={}, month={}, error={}", year, month, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
} 
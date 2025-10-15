package com.hanapath.backend.savings.controller;

import com.hanapath.backend.savings.dto.CreateSavingsGoalRequestDto;
import com.hanapath.backend.savings.dto.SavingsGoalDto;
import com.hanapath.backend.savings.dto.SavingsTransactionDto;
import com.hanapath.backend.savings.entity.SavingsGoal;
import com.hanapath.backend.savings.repository.SavingsGoalRepository;
import com.hanapath.backend.savings.service.SavingsService;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/savings")
@RequiredArgsConstructor
@Slf4j
public class SavingsController {

    private final SavingsService savingsService;
    private final com.hanapath.backend.users.service.UserService userService;
    private final SavingsGoalRepository savingsGoalRepository;

    // 사용자의 모든 목표 조회
    @GetMapping("/goals/{userId}")
    public ResponseEntity<List<SavingsGoalDto>> getUserSavingsGoals(@PathVariable Long userId) {
        List<SavingsGoalDto> goals = savingsService.getUserSavingsGoals(userId);
        return ResponseEntity.ok(goals);
    }

    // 사용자의 활성 목표 조회
    @GetMapping("/goals/{userId}/active")
    public ResponseEntity<List<SavingsGoalDto>> getUserActiveSavingsGoals(@PathVariable Long userId) {
        List<SavingsGoalDto> goals = savingsService.getUserActiveSavingsGoals(userId);
        return ResponseEntity.ok(goals);
    }

    // 목표 상세 조회
    @GetMapping("/goals/{userId}/{goalId}")
    public ResponseEntity<SavingsGoalDto> getSavingsGoal(@PathVariable Long userId, @PathVariable Long goalId) {
        SavingsGoalDto goal = savingsService.getSavingsGoal(userId, goalId);
        return ResponseEntity.ok(goal);
    }

    // 목표 생성
    @PostMapping("/goals/{userId}")
    public ResponseEntity<SavingsGoalDto> createSavingsGoal(@PathVariable Long userId, @RequestBody CreateSavingsGoalRequestDto requestDto) {
        SavingsGoalDto createdGoal = savingsService.createSavingsGoal(userId, requestDto);
        return ResponseEntity.ok(createdGoal);
    }

    // 목표 삭제
    @DeleteMapping("/goals/{userId}/{goalId}")
    public ResponseEntity<Void> deleteSavingsGoal(@PathVariable Long userId, @PathVariable Long goalId) {
        savingsService.deleteSavingsGoal(userId, goalId);
        return ResponseEntity.ok().build();
    }

    // 사용자의 저축 거래 내역 조회
    @GetMapping("/transactions/{userId}")
    public ResponseEntity<List<SavingsTransactionDto>> getUserSavingsTransactions(@PathVariable Long userId) {
        List<SavingsTransactionDto> transactions = savingsService.getUserSavingsTransactions(userId);
        return ResponseEntity.ok(transactions);
    }

    // 특정 목표의 거래 내역 조회
    @GetMapping("/goals/{userId}/{goalId}/transactions")
    public ResponseEntity<List<SavingsTransactionDto>> getSavingsGoalTransactions(@PathVariable Long userId, @PathVariable Long goalId) {
        List<SavingsTransactionDto> transactions = savingsService.getSavingsGoalTransactions(userId, goalId);
        return ResponseEntity.ok(transactions);
    }

    // 수동으로 저축 실행 (테스트용)
    @PostMapping("/goals/{userId}/{goalId}/deposit")
    public ResponseEntity<Void> manualDeposit(@PathVariable Long userId, @PathVariable Long goalId) {
        try {
            // 목표 조회
            SavingsGoalDto goalDto = savingsService.getSavingsGoal(userId, goalId);
            // 목표 엔티티 조회
            SavingsGoal goal = savingsGoalRepository.findById(goalId)
                    .orElseThrow(() -> new RuntimeException("목표를 찾을 수 없습니다."));
            
            // 저축 실행
            savingsService.executeSavingsForGoal(userId, goal);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("수동 저축 실행 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
} 
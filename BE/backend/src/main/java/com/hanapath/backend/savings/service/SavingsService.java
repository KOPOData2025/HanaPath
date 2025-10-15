package com.hanapath.backend.savings.service;

import com.hanapath.backend.savings.dto.CreateSavingsGoalRequestDto;
import com.hanapath.backend.savings.dto.SavingsGoalDto;
import com.hanapath.backend.savings.dto.SavingsTransactionDto;
import com.hanapath.backend.savings.entity.SavingsGoal;
import com.hanapath.backend.savings.entity.SavingsTransaction;
import com.hanapath.backend.savings.repository.SavingsGoalRepository;
import com.hanapath.backend.savings.repository.SavingsTransactionRepository;
import com.hanapath.backend.users.entity.User;
import com.hanapath.backend.users.repository.UserRepository;
import com.hanapath.backend.wallet.entity.Wallet;
import com.hanapath.backend.wallet.entity.WalletTransaction;
import com.hanapath.backend.wallet.repository.WalletRepository;
import com.hanapath.backend.wallet.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import com.hanapath.backend.users.entity.ExperienceEvent;
import com.hanapath.backend.users.service.ExperienceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SavingsService {

    private final SavingsGoalRepository savingsGoalRepository;
    private final SavingsTransactionRepository savingsTransactionRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final ExperienceService experienceService;

    // 사용자의 모든 목표 조회
    public List<SavingsGoalDto> getUserSavingsGoals(Long userId) {
        List<SavingsGoal> goals = savingsGoalRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return goals.stream()
                .map(SavingsGoalDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 사용자의 활성 목표 조회
    public List<SavingsGoalDto> getUserActiveSavingsGoals(Long userId) {
        List<SavingsGoal> goals = savingsGoalRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, SavingsGoal.GoalStatus.ACTIVE);
        return goals.stream()
                .map(SavingsGoalDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 목표 상세 조회
    public SavingsGoalDto getSavingsGoal(Long userId, Long goalId) {
        SavingsGoal goal = savingsGoalRepository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("목표를 찾을 수 없습니다."));
        
        if (!goal.getUser().getId().equals(userId)) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        return SavingsGoalDto.fromEntity(goal);
    }

    // 목표 생성
    @Transactional
    public SavingsGoalDto createSavingsGoal(Long userId, CreateSavingsGoalRequestDto requestDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 월 목표 저축액 계산
        LocalDate today = LocalDate.now();
        long monthsToSave = ChronoUnit.MONTHS.between(today, requestDto.getTargetDate());
        BigDecimal monthlyTarget = requestDto.getTargetAmount()
                .divide(BigDecimal.valueOf(Math.max(1, monthsToSave)), 0, BigDecimal.ROUND_UP);

        SavingsGoal savingsGoal = SavingsGoal.builder()
                .user(user)
                .name(requestDto.getName())
                .memo(requestDto.getMemo())
                .targetAmount(requestDto.getTargetAmount())
                .startDate(today)
                .targetDate(requestDto.getTargetDate())
                .paymentDay(requestDto.getPaymentDay())
                .monthlyTarget(monthlyTarget)
                .category(requestDto.getCategory())
                .status(SavingsGoal.GoalStatus.ACTIVE)
                .build();

        SavingsGoal savedGoal = savingsGoalRepository.save(savingsGoal);
        return SavingsGoalDto.fromEntity(savedGoal);
    }

    // 목표 삭제
    @Transactional
    public void deleteSavingsGoal(Long userId, Long goalId) {
        SavingsGoal goal = savingsGoalRepository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("목표를 찾을 수 없습니다."));
        
        if (!goal.getUser().getId().equals(userId)) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        // 목표에 저축된 금액이 있으면 전자지갑으로 환불
        if (goal.getCurrentAmount().compareTo(BigDecimal.ZERO) > 0) {
            refundToWallet(userId, goal);
        }
        
        savingsGoalRepository.delete(goal);
    }

    // 월별 저축 실행
    @Transactional
    public void executeMonthlySavings(Long userId, Integer paymentDay) {
        List<SavingsGoal> activeGoals = savingsGoalRepository.findActiveGoalsByPaymentDay(userId, paymentDay);
        
        for (SavingsGoal goal : activeGoals) {
            try {
                executeSavingsForGoal(userId, goal);
            } catch (Exception e) {
                log.error("목표 {} 저축 실행 실패: {}", goal.getId(), e.getMessage());
            }
        }
    }

    // 특정 목표에 대한 저축 실행
    @Transactional
    public void executeSavingsForGoal(Long userId, SavingsGoal goal) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("전자지갑을 찾을 수 없습니다."));

        // 전자지갑 잔액 확인
        if (wallet.getBalance().compareTo(goal.getMonthlyTarget()) < 0) {
            throw new RuntimeException("전자지갑 잔액이 부족합니다.");
        }

        // 전자지갑에서 출금
        wallet.setBalance(wallet.getBalance().subtract(goal.getMonthlyTarget()));
        walletRepository.save(wallet);

        // 해당 목표의 저축 횟수 계산
        long savingsCount = savingsTransactionRepository.countBySavingsGoalId(goal.getId());
        long currentMonth = savingsCount + 1;

        // 전자지갑 거래 내역 추가
        WalletTransaction walletTransaction = WalletTransaction.builder()
                .user(user)
                .title(goal.getName() + " 저축")
                .category("저축")
                .amount(goal.getMonthlyTarget().negate()) // 음수로 출금
                .transactionDate(LocalDateTime.now())
                .description(goal.getName() + " 목표 저축을 위한 자동 출금")
                .memo("월 저축액: " + String.format("%,d", goal.getMonthlyTarget().intValue()) + "원 (" + currentMonth + "차)")
                .type(WalletTransaction.TransactionType.EXPENSE)
                .build();
        walletTransactionRepository.save(walletTransaction);

        // 목표 저축액 추가 및 최초 달성 체크
        boolean wasCompleted = goal.isCompleted();
        goal.addAmount(goal.getMonthlyTarget());
        savingsGoalRepository.save(goal);
        if (!wasCompleted && goal.isCompleted()) {
            try {
                experienceService.awardExp(userId, ExperienceEvent.ExperienceType.SAVINGS_GOAL_COMPLETED, String.valueOf(goal.getId()));
            } catch (Exception ignored) {}
        }

        // 저축 거래 내역 추가
        SavingsTransaction savingsTransaction = SavingsTransaction.builder()
                .user(user)
                .savingsGoal(goal)
                .amount(goal.getMonthlyTarget())
                .transactionDate(LocalDateTime.now())
                .memo("월 저축액 납입 (" + currentMonth + "차)")
                .type(SavingsTransaction.TransactionType.DEPOSIT)
                .build();
        savingsTransactionRepository.save(savingsTransaction);
    }

    // 목표 완료 시 환불
    @Transactional
    public void refundToWallet(Long userId, SavingsGoal goal) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("전자지갑을 찾을 수 없습니다."));

        // 전자지갑에 환불
        wallet.setBalance(wallet.getBalance().add(goal.getCurrentAmount()));
        walletRepository.save(wallet);

        // 전자지갑 거래 내역 추가
        WalletTransaction walletTransaction = WalletTransaction.builder()
                .user(user)
                .title(goal.getName() + " 환불")
                .category("저축")
                .amount(goal.getCurrentAmount()) // 양수로 입금
                .transactionDate(LocalDateTime.now())
                .description(goal.getName() + " 목표 해제로 인한 환불")
                .memo("환불 금액: " + String.format("%,d", goal.getCurrentAmount().intValue()) + "원")
                .type(WalletTransaction.TransactionType.INCOME)
                .build();
        walletTransactionRepository.save(walletTransaction);
    }

    // 사용자의 저축 거래 내역 조회
    public List<SavingsTransactionDto> getUserSavingsTransactions(Long userId) {
        List<SavingsTransaction> transactions = savingsTransactionRepository.findByUserIdOrderByTransactionDateDesc(userId);
        return transactions.stream()
                .map(SavingsTransactionDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 특정 목표의 거래 내역 조회
    public List<SavingsTransactionDto> getSavingsGoalTransactions(Long userId, Long goalId) {
        List<SavingsTransaction> transactions = savingsTransactionRepository.findByUserIdAndSavingsGoalIdOrderByTransactionDateDesc(userId, goalId);
        return transactions.stream()
                .map(SavingsTransactionDto::fromEntity)
                .collect(Collectors.toList());
    }
} 
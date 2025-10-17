package com.hanapath.backend.hanamoney.service;

import com.hanapath.backend.hanamoney.dto.HanaMoneyDto;
import com.hanapath.backend.hanamoney.dto.HanaMoneyRequestDto;
import com.hanapath.backend.hanamoney.dto.HanaMoneyTransactionDto;
import com.hanapath.backend.hanamoney.dto.HanaMoneyTransferRequestDto;
import com.hanapath.backend.hanamoney.entity.HanaMoney;
import com.hanapath.backend.hanamoney.entity.HanaMoneyConfig;
import com.hanapath.backend.hanamoney.entity.HanaMoneyTransaction;
import com.hanapath.backend.hanamoney.repository.HanaMoneyConfigRepository;
import com.hanapath.backend.hanamoney.repository.HanaMoneyRepository;
import com.hanapath.backend.hanamoney.repository.HanaMoneyTransactionRepository;
import com.hanapath.backend.users.entity.User;
import com.hanapath.backend.users.repository.UserRepository;
import com.hanapath.backend.wallet.entity.Wallet;
import com.hanapath.backend.wallet.repository.WalletRepository;
import com.hanapath.backend.wallet.service.WalletTransactionService;
import com.hanapath.backend.wallet.dto.WalletTransactionDto;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class HanaMoneyService {

    private final HanaMoneyRepository hanaMoneyRepository;
    private final HanaMoneyTransactionRepository transactionRepository;
    private final HanaMoneyConfigRepository configRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionService walletTransactionService;

    /**
     * 사용자의 하나머니 정보 조회
     */
    @Transactional(readOnly = true)
    public HanaMoneyDto getHanaMoneyByUserId(Long userId) {
        HanaMoney hanaMoney = hanaMoneyRepository.findByUserId(userId)
                .orElseGet(() -> createInitialHanaMoney(userId));
        
        return convertToDto(hanaMoney);
    }

    /**
     * 사용자의 거래 내역 조회
     */
    @Transactional(readOnly = true)
    public Page<HanaMoneyTransactionDto> getTransactionsByUserId(Long userId, Pageable pageable) {
        Page<HanaMoneyTransaction> transactions = transactionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return transactions.map(HanaMoneyTransactionDto::fromEntity);
    }

    /**
     * 사용자의 거래 내역 조회 (날짜 범위)
     */
    @Transactional(readOnly = true)
    public List<HanaMoneyTransactionDto> getTransactionsByUserIdAndDateRange(Long userId, LocalDateTime startDate, LocalDateTime endDate) {
        List<HanaMoneyTransaction> transactions = transactionRepository.findByUserIdAndDateRange(userId, startDate, endDate);
        return transactions.stream()
                .map(HanaMoneyTransactionDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 하나머니 적립/사용/이체 처리
     */
    public HanaMoneyTransactionDto processTransaction(HanaMoneyRequestDto requestDto) {
        User user = userRepository.findById(requestDto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        HanaMoney hanaMoney = hanaMoneyRepository.findByUserId(requestDto.getUserId())
                .orElseGet(() -> createInitialHanaMoney(requestDto.getUserId()));

        HanaMoneyTransaction.TransactionType transactionType = 
                HanaMoneyTransaction.TransactionType.valueOf(requestDto.getTransactionType());
        HanaMoneyTransaction.TransactionCategory category = 
                HanaMoneyTransaction.TransactionCategory.valueOf(requestDto.getCategory());

        // 중복 적립 방지 체크
        if (transactionType == HanaMoneyTransaction.TransactionType.EARN && 
            requestDto.getReferenceId() != null) {
            if (transactionRepository.existsEarnTransactionByUserIdAndReferenceId(
                    requestDto.getUserId(), requestDto.getReferenceId())) {
                throw new IllegalStateException("이미 적립된 항목입니다.");
            }
        }

        // 잔액 업데이트
        BigDecimal balanceAfter;
        if (transactionType == HanaMoneyTransaction.TransactionType.EARN) {
            hanaMoney.addBalance(requestDto.getAmount());
            balanceAfter = hanaMoney.getBalance();
        } else if (transactionType == HanaMoneyTransaction.TransactionType.USE) {
            hanaMoney.subtractBalance(requestDto.getAmount());
            balanceAfter = hanaMoney.getBalance();
        } else { 
            hanaMoney.transferBalance(requestDto.getAmount().abs());
            balanceAfter = hanaMoney.getBalance();
        }

        // 거래 내역 저장
        HanaMoneyTransaction transaction = HanaMoneyTransaction.builder()
                .user(user)
                .transactionType(transactionType)
                .category(category)
                .amount(requestDto.getAmount())
                .balanceAfter(balanceAfter)
                .description(requestDto.getDescription())
                .referenceId(requestDto.getReferenceId())
                .build();

        HanaMoneyTransaction savedTransaction = transactionRepository.save(transaction);
        hanaMoneyRepository.save(hanaMoney);

        log.info("하나머니 거래 처리 완료: 사용자={}, 타입={}, 금액={}, 잔액={}", 
                user.getId(), transactionType, requestDto.getAmount(), balanceAfter);

        return HanaMoneyTransactionDto.fromEntity(savedTransaction);
    }

    /**
     * 출석 체크 적립
     */
    public HanaMoneyTransactionDto processAttendanceCheck(Long userId) {
        // 오늘 이미 출석 체크했는지 확인
        if (transactionRepository.existsAttendanceByUserIdAndDate(userId, LocalDateTime.now())) {
            throw new IllegalStateException("오늘 이미 출석 체크를 완료했습니다.");
        }

        // 출석 체크 포인트 설정 조회
        HanaMoneyConfig config = configRepository.findByConfigTypeAndIsActiveTrue(HanaMoneyConfig.ConfigType.DAILY_ATTENDANCE)
                .orElseThrow(() -> new IllegalStateException("출석 체크 설정을 찾을 수 없습니다."));

        HanaMoneyRequestDto requestDto = HanaMoneyRequestDto.builder()
                .userId(userId)
                .transactionType("EARN")
                .category("ATTENDANCE")
                .amount(config.getAmount())
                .description("일일 출석 체크")
                .referenceId("ATTENDANCE_" + LocalDate.now())
                .build();

        return processTransaction(requestDto);
    }

    /**
     * 퀴즈 정답 적립
     */
    public HanaMoneyTransactionDto processQuizReward(Long userId, String quizId, boolean isCorrect) {
        if (!isCorrect) {
            throw new IllegalArgumentException("퀴즈를 맞추지 못했습니다.");
        }

        HanaMoneyConfig config = configRepository.findByConfigTypeAndIsActiveTrue(HanaMoneyConfig.ConfigType.QUIZ_CORRECT)
                .orElseThrow(() -> new IllegalStateException("퀴즈 보상 설정을 찾을 수 없습니다."));

        HanaMoneyRequestDto requestDto = HanaMoneyRequestDto.builder()
                .userId(userId)
                .transactionType("EARN")
                .category("QUIZ")
                .amount(config.getAmount())
                .description("퀴즈 정답 보상")
                .referenceId("QUIZ_" + quizId)
                .build();

        return processTransaction(requestDto);
    }

    /**
     * 뉴스 읽기 적립
     */
    public HanaMoneyTransactionDto processNewsReadReward(Long userId, String newsId) {
        HanaMoneyConfig config = configRepository.findByConfigTypeAndIsActiveTrue(HanaMoneyConfig.ConfigType.NEWS_READ)
                .orElseThrow(() -> new IllegalStateException("뉴스 읽기 보상 설정을 찾을 수 없습니다."));

        HanaMoneyRequestDto requestDto = HanaMoneyRequestDto.builder()
                .userId(userId)
                .transactionType("EARN")
                .category("NEWS")
                .amount(config.getAmount())
                .description("뉴스 읽기 보상")
                .referenceId("NEWS_" + newsId)
                .build();

        return processTransaction(requestDto);
    }

    /**
     * 스토어 상품 구매
     */
    public HanaMoneyTransactionDto processStorePurchase(Long userId, String productId, BigDecimal price, String productName) {
        HanaMoneyRequestDto requestDto = HanaMoneyRequestDto.builder()
                .userId(userId)
                .transactionType("USE")
                .category("STORE")
                .amount(price.negate()) // 음수로 처리
                .description(productName + " 구매")
                .referenceId("STORE_" + productId)
                .build();

        return processTransaction(requestDto);
    }

    /**
     * 계좌 이체 처리
     */
    public HanaMoneyTransactionDto processAccountTransfer(HanaMoneyTransferRequestDto transferRequest) {
        // 최소 이체 금액 체크 (1,000P)
        if (transferRequest.getAmount().compareTo(new BigDecimal("1000")) < 0) {
            throw new IllegalArgumentException("최소 1,000P부터 이체 가능합니다.");
        }

        // 하나머니 잔액 확인
        HanaMoney hanaMoney = hanaMoneyRepository.findByUserId(transferRequest.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("하나머니 정보를 찾을 수 없습니다."));
        
        if (hanaMoney.getBalance().compareTo(transferRequest.getAmount()) < 0) {
            throw new IllegalArgumentException("잔액이 부족합니다. 현재 잔액: " + hanaMoney.getBalance() + "P");
        }

        // 전자 지갑 확인
        Wallet wallet = walletRepository.findByUserId(transferRequest.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("전자 지갑이 존재하지 않습니다."));

        // 하나머니에서 차감
        HanaMoneyRequestDto requestDto = HanaMoneyRequestDto.builder()
                .userId(transferRequest.getUserId())
                .transactionType("TRANSFER")
                .category("TRANSFER")
                .amount(transferRequest.getAmount().negate()) // 음수로 처리
                .description("계좌 이체: " + transferRequest.getAccountNumber())
                .referenceId("TRANSFER_" + System.currentTimeMillis())
                .build();

        // 하나머니 거래 처리
        HanaMoneyTransactionDto transaction = processTransaction(requestDto);

        // 전자 지갑 잔액 증가
        wallet.addBalance(transferRequest.getAmount());
        walletRepository.save(wallet);

        // 전자 지갑 거래 내역 생성
        walletTransactionService.createTransaction(
            transferRequest.getUserId(),
            WalletTransactionDto.CreateRequestDto.builder()
                .title("하나머니 이체")
                .category("이체")
                .amount(transferRequest.getAmount()) // 양수로 처리 (입금)
                .description("하나머니에서 전자 지갑으로 이체")
                .build()
        );

        log.info("계좌 이체 완료: 사용자={}, 금액={}, 계좌번호={}, 예금주={}, 전자지갑잔액={}", 
                transferRequest.getUserId(), transferRequest.getAmount(), 
                transferRequest.getAccountNumber(), transferRequest.getAccountHolder(), wallet.getBalance());

        return transaction;
    }

    /**
     * 월별 통계 조회
     */
    @Transactional(readOnly = true)
    public HanaMoneyMonthlyStatsDto getMonthlyStats(Long userId, int year, int month) {
        Double monthlyEarned = transactionRepository.getMonthlyTotalByUserIdAndType(
                userId, HanaMoneyTransaction.TransactionType.EARN, year, month);
        Double monthlyUsed = transactionRepository.getMonthlyTotalByUserIdAndType(
                userId, HanaMoneyTransaction.TransactionType.USE, year, month);
        Double monthlyTransferred = transactionRepository.getMonthlyTotalByUserIdAndType(
                userId, HanaMoneyTransaction.TransactionType.TRANSFER, year, month);

        return HanaMoneyMonthlyStatsDto.builder()
                .userId(userId)
                .year(year)
                .month(month)
                .monthlyEarned(monthlyEarned != null ? BigDecimal.valueOf(monthlyEarned) : BigDecimal.ZERO)
                .monthlyUsed(monthlyUsed != null ? BigDecimal.valueOf(monthlyUsed) : BigDecimal.ZERO)
                .monthlyTransferred(monthlyTransferred != null ? BigDecimal.valueOf(monthlyTransferred) : BigDecimal.ZERO)
                .build();
    }

    /**
     * 회원가입 보너스 적립 (중복 지급 방지)
     */
    public HanaMoneyTransactionDto processSignupBonus(Long userId) {
        // 이미 지급되었는지 확인 (referenceId 사용)
        String referenceId = "SIGNUP_BONUS_" + userId;
        if (transactionRepository.existsEarnTransactionByUserIdAndReferenceId(userId, referenceId)) {
            throw new IllegalStateException("이미 회원가입 보너스가 지급되었습니다.");
        }

        // 설정값 조회 (없으면 기본 5000)
        java.math.BigDecimal amount = configRepository
                .findByConfigTypeAndIsActiveTrue(HanaMoneyConfig.ConfigType.SIGNUP_BONUS)
                .map(HanaMoneyConfig::getAmount)
                .orElse(new java.math.BigDecimal("5000"));

        HanaMoneyRequestDto requestDto = HanaMoneyRequestDto.builder()
                .userId(userId)
                .transactionType("EARN")
                .category("EVENT")
                .amount(amount)
                .description("웰컴 하나머니")
                .referenceId(referenceId)
                .build();

        return processTransaction(requestDto);
    }

    /**
     * 초기 하나머니 생성
     */
    private HanaMoney createInitialHanaMoney(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        HanaMoney hanaMoney = HanaMoney.builder()
                .user(user)
                .balance(BigDecimal.ZERO)
                .totalEarned(BigDecimal.ZERO)
                .totalUsed(BigDecimal.ZERO)
                .totalTransferred(BigDecimal.ZERO)
                .build();

        return hanaMoneyRepository.save(hanaMoney);
    }

    /**
     * 엔티티를 DTO로 변환
     */
    private HanaMoneyDto convertToDto(HanaMoney hanaMoney) {
        return HanaMoneyDto.builder()
                .id(hanaMoney.getId())
                .userId(hanaMoney.getUser().getId())
                .balance(hanaMoney.getBalance())
                .totalEarned(hanaMoney.getTotalEarned())
                .totalUsed(hanaMoney.getTotalUsed())
                .totalTransferred(hanaMoney.getTotalTransferred())
                .createdAt(hanaMoney.getCreatedAt())
                .updatedAt(hanaMoney.getUpdatedAt())
                .build();
    }

    /**
     * 월별 통계 DTO
     */
    @lombok.Data
    @Builder
    public static class HanaMoneyMonthlyStatsDto {
        private Long userId;
        private int year;
        private int month;
        private BigDecimal monthlyEarned;
        private BigDecimal monthlyUsed;
        private BigDecimal monthlyTransferred;
    }
} 
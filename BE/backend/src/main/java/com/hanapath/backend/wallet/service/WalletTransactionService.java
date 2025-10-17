package com.hanapath.backend.wallet.service;

import com.hanapath.backend.users.entity.User;
import com.hanapath.backend.users.repository.UserRepository;
import com.hanapath.backend.wallet.dto.WalletTransactionDto;
import com.hanapath.backend.wallet.entity.WalletTransaction;
import com.hanapath.backend.wallet.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WalletTransactionService {

    private final WalletTransactionRepository transactionRepository;
    private final UserRepository userRepository;

    // 거래 내역 생성
    @Transactional
    public WalletTransactionDto.ResponseDto createTransaction(Long userId, WalletTransactionDto.CreateRequestDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        WalletTransaction transaction = WalletTransaction.builder()
                .user(user)
                .title(dto.getTitle())
                .category(dto.getCategory())
                .amount(dto.getAmount())
                .transactionDate(dto.getTransactionDate() != null ? dto.getTransactionDate() : LocalDateTime.now())
                .description(dto.getDescription())
                .memo(dto.getMemo())
                .relatedAccountNumber(dto.getRelatedAccountNumber())
                .build();

        // 거래 타입을 금액으로부터 자동 설정
        transaction.setTypeFromAmount();

        WalletTransaction savedTransaction = transactionRepository.save(transaction);
        
        System.out.println("거래 내역 생성됨: " + savedTransaction.getId() + " - " + savedTransaction.getTitle() + " (" + savedTransaction.getAmount() + "원)");
        
        return WalletTransactionDto.ResponseDto.fromEntity(savedTransaction);
    }

    // 거래 내역 조회 (페이징)
    public WalletTransactionDto.PageResponseDto getTransactions(Long userId, int page, int size, String category, String type, String searchQuery) {
        Pageable pageable = PageRequest.of(page, size);
        Page<WalletTransaction> transactionPage;

        if (searchQuery != null && !searchQuery.trim().isEmpty()) {
            transactionPage = transactionRepository.findByUserIdAndSearchQueryOrderByTransactionDateDesc(userId, searchQuery, pageable);
        } else if (category != null && !category.trim().isEmpty()) {
            transactionPage = transactionRepository.findByUserIdAndCategoryOrderByTransactionDateDesc(userId, category, pageable);
        } else if (type != null && !type.trim().isEmpty()) {
            WalletTransaction.TransactionType transactionType = WalletTransaction.TransactionType.valueOf(type.toUpperCase());
            transactionPage = transactionRepository.findByUserIdAndTypeOrderByTransactionDateDesc(userId, transactionType, pageable);
        } else {
            transactionPage = transactionRepository.findByUserIdOrderByTransactionDateDesc(userId, pageable);
        }

        List<WalletTransactionDto.ResponseDto> transactions = transactionPage.getContent().stream()
                .map(WalletTransactionDto.ResponseDto::fromEntity)
                .collect(Collectors.toList());

        return WalletTransactionDto.PageResponseDto.builder()
                .transactions(transactions)
                .currentPage(transactionPage.getNumber())
                .totalPages(transactionPage.getTotalPages())
                .totalElements(transactionPage.getTotalElements())
                .hasNext(transactionPage.hasNext())
                .hasPrevious(transactionPage.hasPrevious())
                .build();
    }

    // 거래 내역 요약 조회
    public WalletTransactionDto.SummaryDto getTransactionSummary(Long userId) {
        // 총 입금액과 출금액
        Double totalIncome = transactionRepository.getTotalIncomeByUserId(userId);
        Double totalExpense = transactionRepository.getTotalExpenseByUserId(userId);

        // 이번 달 입금액과 출금액
        YearMonth currentMonth = YearMonth.now();
        LocalDateTime startOfMonth = currentMonth.atDay(1).atStartOfDay();
        LocalDateTime endOfMonth = currentMonth.atEndOfMonth().atTime(23, 59, 59);

        Double monthlyIncome = transactionRepository.getMonthlyIncomeByUserId(userId, startOfMonth, endOfMonth);
        Double monthlyExpense = transactionRepository.getMonthlyExpenseByUserId(userId, startOfMonth, endOfMonth);

        return WalletTransactionDto.SummaryDto.builder()
                .totalIncome(BigDecimal.valueOf(totalIncome != null ? totalIncome : 0))
                .totalExpense(BigDecimal.valueOf(totalExpense != null ? totalExpense : 0))
                .monthlyIncome(BigDecimal.valueOf(monthlyIncome != null ? monthlyIncome : 0))
                .monthlyExpense(BigDecimal.valueOf(monthlyExpense != null ? monthlyExpense : 0))
                .build();
    }

    // 거래 내역 ID로 조회
    public Optional<WalletTransaction> getTransactionById(Long transactionId) {
        return transactionRepository.findById(transactionId);
    }

    // 거래 내역 저장
    public WalletTransaction saveTransaction(WalletTransaction transaction) {
        return transactionRepository.save(transaction);
    }
} 
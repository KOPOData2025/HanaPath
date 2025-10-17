package com.hanapath.backend.wallet.dto;

import com.hanapath.backend.wallet.entity.WalletTransaction;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class WalletTransactionDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResponseDto {
        private Long id;
        private String title;
        private String category;
        private BigDecimal amount;
        private LocalDateTime transactionDate;
        private String description;
        private String memo;
        private String relatedAccountNumber;
        private String type;
        private LocalDateTime createdAt;

        public static ResponseDto fromEntity(WalletTransaction transaction) {
            return ResponseDto.builder()
                    .id(transaction.getId())
                    .title(transaction.getTitle())
                    .category(transaction.getCategory())
                    .amount(transaction.getAmount())
                    .transactionDate(transaction.getTransactionDate())
                    .description(transaction.getDescription())
                    .memo(transaction.getMemo())
                    .relatedAccountNumber(transaction.getRelatedAccountNumber())
                    .type(transaction.getType().toString())
                    .createdAt(transaction.getCreatedAt())
                    .build();
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequestDto {
        private String title;
        private String category;
        private BigDecimal amount;
        private LocalDateTime transactionDate;
        private String description;
        private String memo;
        private String relatedAccountNumber;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PageResponseDto {
        private List<ResponseDto> transactions;
        private int currentPage;
        private int totalPages;
        private long totalElements;
        private boolean hasNext;
        private boolean hasPrevious;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SummaryDto {
        private BigDecimal totalIncome;
        private BigDecimal totalExpense;
        private BigDecimal monthlyIncome;
        private BigDecimal monthlyExpense;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MemoUpdateDto {
        private String memo;
    }
} 
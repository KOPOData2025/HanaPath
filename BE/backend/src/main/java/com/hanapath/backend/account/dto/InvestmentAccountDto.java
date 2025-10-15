package com.hanapath.backend.account.dto;

import com.hanapath.backend.account.entity.InvestmentAccount;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class InvestmentAccountDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequestDto {
        private String accountPassword; // 계좌 비밀번호 (4자리)
        private boolean termsAgreed; // 약관 동의 여부
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResponseDto {
        private Long id;
        private Long userId;
        private String accountNumber;
        private BigDecimal balance;
        private BigDecimal totalProfitLoss;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static ResponseDto fromEntity(InvestmentAccount account) {
            return ResponseDto.builder()
                    .id(account.getId())
                    .userId(account.getUser().getId())
                    .accountNumber(account.getAccountNumber())
                    .balance(account.getBalance())
                    .totalProfitLoss(account.getTotalProfitLoss())
                    .status(account.getStatus().toString())
                    .createdAt(account.getCreatedAt())
                    .updatedAt(account.getUpdatedAt())
                    .build();
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BalanceDto {
        private BigDecimal balance;
        private BigDecimal totalProfitLoss;
        private String accountNumber;
        private String status;
    }
}
package com.hanapath.backend.wallet.dto;

import com.hanapath.backend.wallet.entity.Wallet;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class WalletDto {

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
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static ResponseDto fromEntity(Wallet wallet) {
            return ResponseDto.builder()
                    .id(wallet.getId())
                    .userId(wallet.getUser().getId())
                    .accountNumber(wallet.getAccountNumber())
                    .balance(wallet.getBalance())
                    .status(wallet.getStatus().toString())
                    .createdAt(wallet.getCreatedAt())
                    .updatedAt(wallet.getUpdatedAt())
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
        private String accountNumber;
        private String status;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TransferRequestDto {
        private Long recipientId; // 수신자 ID
        private BigDecimal amount; // 송금 금액
        private String password; // 전자 지갑 비밀번호
        private String description; // 송금 설명
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TransferResponseDto {
        private Long transactionId;
        private String senderAccountNumber;
        private String recipientAccountNumber;
        private BigDecimal amount;
        private BigDecimal senderBalanceAfter;
        private BigDecimal recipientBalanceAfter;
        private String status;
        private LocalDateTime transferDate;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PasswordValidationDto {
        private String password; // 검증할 비밀번호
    }
}
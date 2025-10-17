package com.hanapath.backend.hanamoney.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HanaMoneyRequestDto {
    private Long userId;
    private String transactionType; // EARN, USE, TRANSFER
    private String category; // ATTENDANCE, QUIZ, NEWS, STORE, TRANSFER 등
    private BigDecimal amount;
    private String description;
    private String referenceId; // 관련 ID (퀴즈 ID, 뉴스 ID, 상품 ID 등)
} 
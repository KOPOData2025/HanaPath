package com.hanapath.backend.hanamoney.dto;

import com.hanapath.backend.hanamoney.entity.HanaMoneyTransaction;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HanaMoneyTransactionDto {
    private Long id;
    private Long userId;
    private String transactionType;
    private String category;
    private BigDecimal amount;
    private BigDecimal balanceAfter;
    private String description;
    private String referenceId;
    private LocalDateTime createdAt;

    public static HanaMoneyTransactionDto fromEntity(HanaMoneyTransaction entity) {
        return HanaMoneyTransactionDto.builder()
                .id(entity.getId())
                .userId(entity.getUser().getId())
                .transactionType(entity.getTransactionType().getDescription())
                .category(entity.getCategory().getDescription())
                .amount(entity.getAmount())
                .balanceAfter(entity.getBalanceAfter())
                .description(entity.getDescription())
                .referenceId(entity.getReferenceId())
                .createdAt(entity.getCreatedAt())
                .build();
    }
} 
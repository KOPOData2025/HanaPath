package com.hanapath.backend.savings.dto;

import com.hanapath.backend.savings.entity.SavingsTransaction;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavingsTransactionDto {

    private Long id;
    private Long savingsGoalId;
    private String savingsGoalName;
    private BigDecimal amount;
    private LocalDateTime transactionDate;
    private String memo;
    private SavingsTransaction.TransactionType type;
    private LocalDateTime createdAt;

    public static SavingsTransactionDto fromEntity(SavingsTransaction transaction) {
        return SavingsTransactionDto.builder()
                .id(transaction.getId())
                .savingsGoalId(transaction.getSavingsGoal().getId())
                .savingsGoalName(transaction.getSavingsGoal().getName())
                .amount(transaction.getAmount())
                .transactionDate(transaction.getTransactionDate())
                .memo(transaction.getMemo())
                .type(transaction.getType())
                .createdAt(transaction.getCreatedAt())
                .build();
    }
} 
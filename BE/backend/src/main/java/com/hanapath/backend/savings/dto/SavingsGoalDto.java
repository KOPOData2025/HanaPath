package com.hanapath.backend.savings.dto;

import com.hanapath.backend.savings.entity.SavingsGoal;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavingsGoalDto {

    private Long id;
    private String name;
    private String memo;
    private BigDecimal targetAmount;
    private BigDecimal currentAmount;
    private LocalDate startDate;
    private LocalDate targetDate;
    private Integer paymentDay;
    private BigDecimal monthlyTarget;
    private String category;
    private SavingsGoal.GoalStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 계산된 필드들
    private double progressPercentage;
    private BigDecimal remainingAmount;
    private boolean completed;
    private long daysLeft;

    public static SavingsGoalDto fromEntity(SavingsGoal savingsGoal) {
        LocalDate today = LocalDate.now();
        long daysLeft = savingsGoal.getTargetDate().toEpochDay() - today.toEpochDay();

        return SavingsGoalDto.builder()
                .id(savingsGoal.getId())
                .name(savingsGoal.getName())
                .memo(savingsGoal.getMemo())
                .targetAmount(savingsGoal.getTargetAmount())
                .currentAmount(savingsGoal.getCurrentAmount())
                .startDate(savingsGoal.getStartDate())
                .targetDate(savingsGoal.getTargetDate())
                .paymentDay(savingsGoal.getPaymentDay())
                .monthlyTarget(savingsGoal.getMonthlyTarget())
                .category(savingsGoal.getCategory())
                .status(savingsGoal.getStatus())
                .createdAt(savingsGoal.getCreatedAt())
                .updatedAt(savingsGoal.getUpdatedAt())
                .progressPercentage(savingsGoal.getProgressPercentage())
                .remainingAmount(savingsGoal.getRemainingAmount())
                .completed(savingsGoal.isCompleted())
                .daysLeft(Math.max(0, daysLeft))
                .build();
    }
} 
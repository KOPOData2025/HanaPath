package com.hanapath.backend.savings.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSavingsGoalRequestDto {

    private String name;
    private String memo;
    private BigDecimal targetAmount;
    private LocalDate targetDate;
    private Integer paymentDay;
    private String category;
} 
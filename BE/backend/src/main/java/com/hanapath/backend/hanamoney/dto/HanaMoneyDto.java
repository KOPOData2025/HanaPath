package com.hanapath.backend.hanamoney.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HanaMoneyDto {
    private Long id;
    private Long userId;
    private BigDecimal balance;
    private BigDecimal totalEarned;
    private BigDecimal totalUsed;
    private BigDecimal totalTransferred;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 
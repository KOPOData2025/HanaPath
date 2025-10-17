package com.hanapath.backend.account.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "investment_recharge",
       uniqueConstraints = {
               @UniqueConstraint(columnNames = {"user_id", "recharge_date"})
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvestmentRecharge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "recharge_date", nullable = false)
    private LocalDate rechargeDate;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "level_at_recharge", nullable = false)
    private Integer levelAtRecharge;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}



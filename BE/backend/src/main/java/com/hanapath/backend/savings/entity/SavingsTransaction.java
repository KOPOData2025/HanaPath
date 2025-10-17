package com.hanapath.backend.savings.entity;

import com.hanapath.backend.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "savings_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavingsTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "savings_goal_id", nullable = false)
    private SavingsGoal savingsGoal;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount; // 저축 금액

    @Column(nullable = false)
    private LocalDateTime transactionDate; // 거래 일시

    @Column(length = 500)
    private String memo; // 메모

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type; // 거래 타입

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum TransactionType {
        DEPOSIT,    // 저축
        WITHDRAWAL  // 인출
    }
} 
package com.hanapath.backend.savings.entity;

import com.hanapath.backend.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "savings_goals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavingsGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String name; // 목표 이름

    @Column(length = 500)
    private String memo; // 메모

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal targetAmount; // 목표 금액

    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal currentAmount = BigDecimal.ZERO; // 현재 저축 금액

    @Column(nullable = false)
    private LocalDate startDate; // 시작일

    @Column(nullable = false)
    private LocalDate targetDate; // 목표 달성일

    @Column(nullable = false)
    private Integer paymentDay; // 납입일 (1-31)

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal monthlyTarget; // 월 목표 저축액

    @Column(nullable = false, length = 50)
    private String category; // 카테고리

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private GoalStatus status = GoalStatus.ACTIVE; // 목표 상태

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum GoalStatus {
        ACTIVE,     // 진행 중
        COMPLETED,  // 완료
        PAUSED      // 일시정지
    }

    // 달성률 계산
    public double getProgressPercentage() {
        if (targetAmount.compareTo(BigDecimal.ZERO) == 0) {
            return 0.0;
        }
        return currentAmount.divide(targetAmount, 4, BigDecimal.ROUND_HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }

    // 남은 금액 계산
    public BigDecimal getRemainingAmount() {
        return targetAmount.subtract(currentAmount);
    }

    // 목표 달성 여부 확인
    public boolean isCompleted() {
        return currentAmount.compareTo(targetAmount) >= 0;
    }

    // 저축액 추가
    public void addAmount(BigDecimal amount) {
        this.currentAmount = this.currentAmount.add(amount);
        if (isCompleted()) {
            this.status = GoalStatus.COMPLETED;
        }
    }
} 
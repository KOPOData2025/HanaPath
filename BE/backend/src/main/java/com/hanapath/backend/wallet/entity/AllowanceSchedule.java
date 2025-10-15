package com.hanapath.backend.wallet.entity;

import com.hanapath.backend.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "allowance_schedules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AllowanceSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", nullable = false)
    private User parent; // 부모 사용자

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "child_id", nullable = false)
    private User child; // 자식 사용자

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount; // 용돈 금액

    @Column(nullable = false)
    private Integer paymentDay; // 매월 지급일 (1-31)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ScheduleStatus status = ScheduleStatus.ACTIVE; // 스케줄 상태

    @Column(nullable = false)
    private LocalDateTime lastPaymentDate; // 마지막 지급일

    @Column(nullable = false)
    private LocalDateTime nextPaymentDate; // 다음 지급일

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum ScheduleStatus {
        ACTIVE,    // 활성
        PAUSED,    // 일시정지
        CANCELLED  // 취소
    }

    /**
     * 다음 지급일 계산
     */
    public void calculateNextPaymentDate() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime next = now.withDayOfMonth(paymentDay);
        
        // 이번 달 지급일이 이미 지났으면 다음 달로 설정
        if (next.isBefore(now)) {
            next = next.plusMonths(1);
        }
        
        this.nextPaymentDate = next;
    }

    /**
     * 지급일 확인
     */
    public boolean isPaymentDue() {
        return LocalDateTime.now().isAfter(this.nextPaymentDate) || 
               LocalDateTime.now().isEqual(this.nextPaymentDate);
    }

    /**
     * 지급 완료 처리
     */
    public void markAsPaid() {
        this.lastPaymentDate = this.nextPaymentDate;
        this.nextPaymentDate = this.nextPaymentDate.plusMonths(1);
    }
} 
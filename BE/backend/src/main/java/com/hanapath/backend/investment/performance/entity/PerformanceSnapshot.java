package com.hanapath.backend.investment.performance.entity;

import com.hanapath.backend.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "performance_snapshots",
       uniqueConstraints = {
               @UniqueConstraint(name = "uk_user_snapshot_date", columnNames = {"user_id", "snapshot_date"})
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerformanceSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 스냅샷 기준 일자
    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    // 스냅샷 생성 시각
    @Column(name = "snapshot_time", nullable = false)
    private LocalDateTime snapshotTime;

    // 총자산(평가금액 + 예수금)
    @Column(precision = 18, scale = 2, nullable = false)
    private BigDecimal totalAssets;

    // 미실현손익 합계
    @Column(precision = 18, scale = 2, nullable = false)
    private BigDecimal unrealizedProfit;

    // 실현손익 합계
    @Column(precision = 18, scale = 2, nullable = false)
    private BigDecimal realizedProfit;

    // 누적 손익 (실현 + 미실현)
    @Column(precision = 18, scale = 2, nullable = false)
    private BigDecimal combinedProfit;

    // 기준 원금
    @Column(precision = 18, scale = 2, nullable = false)
    private BigDecimal initialPrincipal;

    // 누적 수익률(%)
    @Column(precision = 9, scale = 4, nullable = false)
    private BigDecimal profitRate;

    @CreationTimestamp
    private LocalDateTime createdAt;
}



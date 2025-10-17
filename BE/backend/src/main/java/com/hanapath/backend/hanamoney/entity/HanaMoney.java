package com.hanapath.backend.hanamoney.entity;

import com.hanapath.backend.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "hana_money")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HanaMoney {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal balance; // 현재 잔액

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalEarned; // 총 적립액

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalUsed; // 총 사용액

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalTransferred; // 총 이체액

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // 잔액 업데이트 메서드
    public void addBalance(BigDecimal amount) {
        this.balance = this.balance.add(amount);
        this.totalEarned = this.totalEarned.add(amount);
    }

    public void subtractBalance(BigDecimal amount) {
        if (this.balance.compareTo(amount) < 0) {
            throw new IllegalStateException("잔액이 부족합니다.");
        }
        this.balance = this.balance.subtract(amount);
        this.totalUsed = this.totalUsed.add(amount);
    }

    public void transferBalance(BigDecimal amount) {
        if (this.balance.compareTo(amount) < 0) {
            throw new IllegalStateException("잔액이 부족합니다.");
        }
        this.balance = this.balance.subtract(amount);
        this.totalTransferred = this.totalTransferred.add(amount);
    }
} 
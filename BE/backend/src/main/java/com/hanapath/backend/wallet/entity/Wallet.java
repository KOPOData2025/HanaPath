package com.hanapath.backend.wallet.entity;

import com.hanapath.backend.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "wallets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, unique = true, length = 14)
    private String accountNumber; // 620 + 6자리 + 5자리 = 14자리 숫자

    @Column(nullable = false, length = 255)
    private String accountPassword; // 암호화된 계좌 비밀번호

    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal balance = new BigDecimal("200000"); // 잔액 

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private WalletStatus status = WalletStatus.ACTIVE; // 계좌 상태

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum WalletStatus {
        ACTIVE,    // 활성
        INACTIVE,  // 비활성
        SUSPENDED  // 정지
    }

    /**
     * 잔액 차감
     */
    public void subtractBalance(BigDecimal amount) {
        if (this.balance.compareTo(amount) < 0) {
            throw new IllegalStateException("잔액이 부족합니다");
        }
        this.balance = this.balance.subtract(amount);
    }

    /**
     * 잔액 증가
     */
    public void addBalance(BigDecimal amount) {
        this.balance = this.balance.add(amount);
    }
}
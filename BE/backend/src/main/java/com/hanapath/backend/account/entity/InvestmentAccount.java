package com.hanapath.backend.account.entity;

import com.hanapath.backend.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "investment_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvestmentAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, unique = true, length = 11)
    private String accountNumber; // 8자리 + 010 = 11자리 숫자

    @Column(nullable = false, length = 255)
    private String accountPassword; // 암호화된 계좌 비밀번호

    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal balance = BigDecimal.valueOf(7770000); // 초기 모의 투자금 777만원

    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalProfitLoss = BigDecimal.ZERO; // 총 손익

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AccountStatus status = AccountStatus.ACTIVE; // 계좌 상태

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum AccountStatus {
        ACTIVE,    // 활성
        INACTIVE,  // 비활성
        SUSPENDED  // 정지
    }
}
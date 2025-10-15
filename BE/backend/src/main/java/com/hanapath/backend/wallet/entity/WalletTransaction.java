package com.hanapath.backend.wallet.entity;

import com.hanapath.backend.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "wallet_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String title; // 거래 제목

    @Column(nullable = false, length = 50)
    private String category; // 카테고리

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount; // 거래 금액 (양수: 입금, 음수: 출금)

    @Column(nullable = false)
    private LocalDateTime transactionDate; // 거래 일시

    @Column(length = 500)
    private String description; // 거래 설명

    @Column(length = 100)
    private String memo; // 사용자 메모

    @Column(length = 20)
    private String relatedAccountNumber; // 관련 계좌번호 (송금 시 상대방 계좌번호)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TransactionType type = TransactionType.EXPENSE; // 거래 타입

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum TransactionType {
        INCOME,   // 입금
        EXPENSE   // 출금
    }

    // 거래 타입을 금액으로부터 자동 설정
    public void setTypeFromAmount() {
        this.type = this.amount.compareTo(BigDecimal.ZERO) >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE;
    }
} 
package com.hanapath.backend.hanamoney.entity;

import com.hanapath.backend.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "hana_money_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HanaMoneyTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType transactionType; // 적립, 사용, 이체

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionCategory category; // 출석, 퀴즈, 뉴스, 스토어, 이체 등

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount; // 거래 금액 (적립은 양수, 사용/이체는 음수)

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal balanceAfter; // 거래 후 잔액

    @Column(length = 200)
    private String description; // 거래 설명

    @Column(length = 100)
    private String referenceId; // 관련 ID (퀴즈 ID, 뉴스 ID, 상품 ID 등)

    @CreationTimestamp
    private LocalDateTime createdAt;

    // 거래 타입 열거형
    public enum TransactionType {
        EARN("적립"),
        USE("사용"),
        TRANSFER("이체");

        private final String description;

        TransactionType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    // 거래 카테고리 열거형
    public enum TransactionCategory {
        ATTENDANCE("출석"),
        QUIZ("퀴즈"),
        NEWS("뉴스"),
        STORE("스토어"),
        TRANSFER("이체"),
        EVENT("이벤트"),
        INVITE("초대"),
        DAILY("일일"),
        WEEKLY("주간"),
        MONTHLY("월간");

        private final String description;

        TransactionCategory(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
} 
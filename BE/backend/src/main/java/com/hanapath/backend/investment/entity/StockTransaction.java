package com.hanapath.backend.investment.entity;

import com.hanapath.backend.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockTransaction {

    public enum TransactionType {
        BUY, SELL
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 10)
    private String ticker;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TransactionType type;

    @Column(nullable = false)
    private Long quantity;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal pricePerShare;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount; // 체결금액 = 수량 * 단가

    @CreationTimestamp
    private LocalDateTime createdAt;
}

package com.hanapath.backend.investment.entity;

import com.hanapath.backend.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_holdings", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_ticker", columnNames = {"user_id", "ticker"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockHolding {

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

    @Column(nullable = false)
    private Long quantity; // 보유 수량 (주)

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal averagePrice; // 주당 평균 매입가

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

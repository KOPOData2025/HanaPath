package com.hanapath.backend.stock.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "stock_historical_data", indexes = {
        @Index(name = "idx_ticker_date", columnList = "ticker, date", unique = true),
        @Index(name = "idx_ticker", columnList = "ticker"),
        @Index(name = "idx_date", columnList = "date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockHistoricalData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // stock_master와 FK 관계
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_master_id", nullable = false)
    private StockMaster stockMaster;

    @Column(nullable = false, length = 10)
    private String ticker; // 검색 성능을 위해 중복 저장

    @Column(nullable = false, length = 8) // YYYYMMDD
    private String date;

    @Column(nullable = false)
    private Integer open;   // 시가

    @Column(nullable = false)
    private Integer high;   // 고가

    @Column(nullable = false)
    private Integer low;    // 저가

    @Column(nullable = false)
    private Integer close;  // 종가

    @Column(nullable = false)
    private Long volume;    // 거래량

    @CreationTimestamp
    private LocalDateTime createdAt;
}




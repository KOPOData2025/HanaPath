package com.hanapath.backend.investment.dto;

import com.hanapath.backend.investment.entity.StockFavorite;
import com.hanapath.backend.investment.entity.StockHolding;
import com.hanapath.backend.investment.entity.StockTransaction;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class InvestmentTradingDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderRequest {
        private String ticker;
        private String name;
        private Long quantity;
        private BigDecimal price; // 지정가
        private String accountPassword; // 계좌 비밀번호 (4자리)
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderResponse {
        private Long transactionId;
        private String ticker;
        private String name;
        private String type; // BUY/SELL
        private Long quantity;
        private BigDecimal pricePerShare;
        private BigDecimal amount;
        private BigDecimal newBalance;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HoldingResponse {
        private String ticker;
        private String name;
        private Long quantity;
        private BigDecimal averagePrice;

        public static HoldingResponse from(StockHolding h) {
            return HoldingResponse.builder()
                    .ticker(h.getTicker())
                    .name(h.getName())
                    .quantity(h.getQuantity())
                    .averagePrice(h.getAveragePrice())
                    .build();
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TransactionResponse {
        private Long id;
        private String ticker;
        private String name;
        private String type;
        private Long quantity;
        private BigDecimal pricePerShare;
        private BigDecimal amount;
        private LocalDateTime createdAt;

        public static TransactionResponse from(StockTransaction t) {
            return TransactionResponse.builder()
                    .id(t.getId())
                    .ticker(t.getTicker())
                    .name(t.getName())
                    .type(t.getType().name())
                    .quantity(t.getQuantity())
                    .pricePerShare(t.getPricePerShare())
                    .amount(t.getAmount())
                    .createdAt(t.getCreatedAt())
                    .build();
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FavoriteResponse {
        private Long id;
        private String ticker;
        private String name;
        private LocalDateTime createdAt;

        public static FavoriteResponse from(StockFavorite f) {
            return FavoriteResponse.builder()
                    .id(f.getId())
                    .ticker(f.getTicker())
                    .name(f.getName())
                    .createdAt(f.getCreatedAt())
                    .build();
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PagedTransactionsResponse {
        private List<TransactionResponse> transactions;
        private int total;
    }
}

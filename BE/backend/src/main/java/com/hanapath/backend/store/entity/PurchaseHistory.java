package com.hanapath.backend.store.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "purchase_history")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "product_brand", nullable = false)
    private String productBrand;

    @Column(name = "product_category", nullable = false)
    private String productCategory;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "total_price", nullable = false)
    private Integer totalPrice;

    @Column(name = "hana_money_used")
    private Integer hanaMoneyUsed;

    @Column(name = "wallet_amount")
    private Integer walletAmount;

    @Column(name = "purchase_date", nullable = false)
    private LocalDateTime purchaseDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    @Column(name = "is_used", nullable = false)
    private Boolean isUsed;

    @Column(name = "gift_code")
    private String giftCode;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private PurchaseStatus status;

    public enum PurchaseStatus {
        PURCHASED,    // 구매 완료
        EXPIRED,      // 만료됨
        USED,         // 사용됨
        REFUNDED      // 환불됨
    }
} 
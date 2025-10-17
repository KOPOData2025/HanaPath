package com.hanapath.backend.store.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "store_product")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  // 상품 ID (자동 증가)

    @Column(nullable = false)
    private String name;  // 상품 이름

    private String brand;  // 브랜드명

    private String category;  // 카테고리 

    @Column(nullable = false)
    private Integer price;  // 현재 가격

    @Column(name = "original_price")
    private Integer originalPrice;  // 원래 가격

    @Lob
    @Column(name = "image_data", columnDefinition = "LONGBLOB")
    private byte[] imageData;

    @Column(name = "is_popular")
    private Boolean isPopular;  // 인기 상품 여부

    private Integer discount;  // 할인율 (%)

    private Integer stock;  // 재고 수량

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();  // 생성 시각

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();  // 수정 시각

    @Column(name = "valid_days")
    private Integer validDays;  // 유효기간

    @Column(name = "vendor")
    private String vendor;  // 교환처

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;  // 상품 상세 설명

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

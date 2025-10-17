package com.hanapath.backend.store.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProductResponseDto {
    private Long id;
    private String name;
    private String brand;
    private String category;
    private Integer price;
    private Integer originalPrice;
    private Boolean isPopular;
    private Integer discount;
    private Integer stock;
    private Integer validDays;
    private String vendor;
    private String description;
    private String imageBase64;
}

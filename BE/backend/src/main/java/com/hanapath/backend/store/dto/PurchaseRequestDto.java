package com.hanapath.backend.store.dto;

import lombok.Data;

@Data
public class PurchaseRequestDto {
    private Long productId;
    private Long userId;      
    private Integer quantity; 
    private String paymentMethod; // "hanaMoney" 또는 "wallet"
    private Boolean useHanaMoney; 
    private Integer hanaMoneyAmount; 
    private String walletPassword;
}

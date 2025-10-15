package com.hanapath.backend.hanamoney.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HanaMoneyTransferRequestDto {
    private Long userId;
    private BigDecimal amount;
    private String accountNumber; // 이체할 계좌번호
    private String bankCode; // 은행 코드
    private String accountHolder; // 예금주명
} 
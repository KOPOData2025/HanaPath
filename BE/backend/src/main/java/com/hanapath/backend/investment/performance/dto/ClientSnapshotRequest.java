package com.hanapath.backend.investment.performance.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class ClientSnapshotRequest {
    private BigDecimal profitRate; 
}



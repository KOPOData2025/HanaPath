package com.hanapath.backend.investment.performance.dto;

import com.hanapath.backend.investment.performance.entity.PerformanceSnapshot;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerformanceSnapshotDto {
    private LocalDate snapshotDate;
    private LocalDateTime snapshotTime;
    private BigDecimal profitRate;

    public static PerformanceSnapshotDto from(PerformanceSnapshot s) {
        BigDecimal pr = s.getProfitRate();
        if (pr != null) {
            pr = pr.stripTrailingZeros();
            if (pr.scale() < 0) pr = pr.setScale(0);
        }
        return PerformanceSnapshotDto.builder()
                .snapshotDate(s.getSnapshotDate())
                .snapshotTime(s.getSnapshotTime())
                .profitRate(pr)
                .build();
    }
}



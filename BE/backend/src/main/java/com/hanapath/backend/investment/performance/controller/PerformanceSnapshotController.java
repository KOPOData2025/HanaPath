package com.hanapath.backend.investment.performance.controller;

import com.hanapath.backend.investment.performance.dto.PerformanceSnapshotDto;
import com.hanapath.backend.investment.performance.dto.ClientSnapshotRequest;
import com.hanapath.backend.investment.performance.entity.PerformanceSnapshot;
import com.hanapath.backend.investment.performance.service.PerformanceSnapshotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/investment/performance")
@RequiredArgsConstructor
public class PerformanceSnapshotController {

    private final PerformanceSnapshotService snapshotService;

    @GetMapping("/{userId}/latest")
    public ResponseEntity<List<PerformanceSnapshotDto>> getLatest(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "7") int limit
    ) {
        var list = snapshotService.getLatestSnapshots(userId, Math.max(1, Math.min(limit, 90)))
                .stream().map(PerformanceSnapshotDto::from).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{userId}/all")
    public ResponseEntity<List<PerformanceSnapshotDto>> getAllAscending(@PathVariable Long userId) {
        var list = snapshotService.getAllSnapshotsAscending(userId)
                .stream().map(PerformanceSnapshotDto::from).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @PostMapping("/snapshot/{userId}/client")
    public ResponseEntity<PerformanceSnapshotDto> upsertFromClient(
            @PathVariable Long userId,
            @RequestBody ClientSnapshotRequest body
    ) {
        ZonedDateTime nowKst = ZonedDateTime.now(ZoneId.of("Asia/Seoul"));
        var date = nowKst.toLocalDate();
        var existingOpt = snapshotService.getByUserAndDate(userId, date);
        PerformanceSnapshot s;
        if (existingOpt.isPresent()) {
            s = existingOpt.get();
            s.setSnapshotTime(nowKst.toLocalDateTime());
            if (body.getProfitRate() != null) {
                BigDecimal scaled = body.getProfitRate()
                        .setScale(2, RoundingMode.HALF_UP)
                        .stripTrailingZeros();
                if (scaled.scale() < 0) {
                    scaled = scaled.setScale(0);
                }
                s.setProfitRate(scaled);
            }
        } else {
            s = new PerformanceSnapshot();
            s.setUser(snapshotService.loadUser(userId));
            s.setSnapshotDate(date);
            s.setSnapshotTime(nowKst.toLocalDateTime());
            s.setTotalAssets(java.math.BigDecimal.ZERO);
            s.setUnrealizedProfit(java.math.BigDecimal.ZERO);
            s.setRealizedProfit(java.math.BigDecimal.ZERO);
            s.setCombinedProfit(java.math.BigDecimal.ZERO);
            s.setInitialPrincipal(java.math.BigDecimal.valueOf(7_770_000));
            if (body.getProfitRate() != null) {
                BigDecimal scaled = body.getProfitRate()
                        .setScale(2, RoundingMode.HALF_UP)
                        .stripTrailingZeros();
                if (scaled.scale() < 0) {
                    scaled = scaled.setScale(0);
                }
                s.setProfitRate(scaled);
            } else {
                s.setProfitRate(java.math.BigDecimal.ZERO);
            }
        }
        s = snapshotService.saveSnapshot(s);
        return ResponseEntity.ok(PerformanceSnapshotDto.from(s));
    }
}



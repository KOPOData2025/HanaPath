package com.hanapath.backend.investment.performance.service;

import com.hanapath.backend.investment.performance.entity.PerformanceSnapshot;
import com.hanapath.backend.investment.performance.repository.PerformanceSnapshotRepository;
import com.hanapath.backend.users.entity.User;
import com.hanapath.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PerformanceSnapshotService {

    private final PerformanceSnapshotRepository snapshotRepository;
    private final UserRepository userRepository;

    @Transactional
    public PerformanceSnapshot createOrUpdateSnapshotForUser(Long userId, ZonedDateTime snapshotTimeKst) {
        User user = userRepository.findById(userId).orElseThrow();
        LocalDate snapshotDate = snapshotTimeKst.toLocalDate();
        var existing = snapshotRepository.findByUserIdAndDate(userId, snapshotDate).orElse(null);
        PerformanceSnapshot snapshot = existing != null ? existing : new PerformanceSnapshot();
        snapshot.setUser(user);
        snapshot.setSnapshotDate(snapshotDate);
        snapshot.setSnapshotTime(snapshotTimeKst.toLocalDateTime());
        if (snapshot.getInitialPrincipal() == null) snapshot.setInitialPrincipal(BigDecimal.valueOf(7_770_000));
        if (snapshot.getProfitRate() == null) snapshot.setProfitRate(BigDecimal.ZERO);
        if (snapshot.getTotalAssets() == null) snapshot.setTotalAssets(BigDecimal.ZERO);
        if (snapshot.getUnrealizedProfit() == null) snapshot.setUnrealizedProfit(BigDecimal.ZERO);
        if (snapshot.getRealizedProfit() == null) snapshot.setRealizedProfit(BigDecimal.ZERO);
        if (snapshot.getCombinedProfit() == null) snapshot.setCombinedProfit(BigDecimal.ZERO);
        return snapshotRepository.save(snapshot);
    }

    @Transactional(readOnly = true)
    public java.util.Optional<PerformanceSnapshot> getByUserAndDate(Long userId, java.time.LocalDate date) {
        return snapshotRepository.findByUserIdAndDate(userId, date);
    }

    @Transactional(readOnly = true)
    public User loadUser(Long userId) { return userRepository.findById(userId).orElseThrow(); }

    @Transactional
    public PerformanceSnapshot saveSnapshot(PerformanceSnapshot s) { return snapshotRepository.save(s); }

    @Transactional
    public int snapshotAllUsers(ZonedDateTime snapshotTimeKst) { return 0; }

    @Transactional(readOnly = true)
    public List<PerformanceSnapshot> getLatestSnapshots(Long userId, int limit) {
        return snapshotRepository.findLatestByUserId(userId, PageRequest.of(0, limit));
    }

    @Transactional(readOnly = true)
    public List<PerformanceSnapshot> getAllSnapshotsAscending(Long userId) {
        return snapshotRepository.findAllAscending(userId);
    }
}



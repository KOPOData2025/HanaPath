package com.hanapath.backend.investment.performance.repository;

import com.hanapath.backend.investment.performance.entity.PerformanceSnapshot;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PerformanceSnapshotRepository extends JpaRepository<PerformanceSnapshot, Long> {

    @Query("SELECT s FROM PerformanceSnapshot s WHERE s.user.id = :userId AND s.snapshotDate = :date")
    Optional<PerformanceSnapshot> findByUserIdAndDate(@Param("userId") Long userId, @Param("date") LocalDate date);

    @Query("SELECT s FROM PerformanceSnapshot s WHERE s.user.id = :userId ORDER BY s.snapshotDate DESC, s.snapshotTime DESC")
    List<PerformanceSnapshot> findLatestByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT s FROM PerformanceSnapshot s WHERE s.user.id = :userId ORDER BY s.snapshotDate ASC, s.snapshotTime ASC")
    List<PerformanceSnapshot> findAllAscending(@Param("userId") Long userId);
}



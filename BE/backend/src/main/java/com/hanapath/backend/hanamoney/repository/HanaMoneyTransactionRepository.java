package com.hanapath.backend.hanamoney.repository;

import com.hanapath.backend.hanamoney.entity.HanaMoneyTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface HanaMoneyTransactionRepository extends JpaRepository<HanaMoneyTransaction, Long> {
    
    // 사용자별 거래 내역 조회 (최신순)
    Page<HanaMoneyTransaction> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    // 사용자별 거래 내역 조회 (날짜 범위)
    @Query("SELECT t FROM HanaMoneyTransaction t WHERE t.user.id = :userId AND t.createdAt BETWEEN :startDate AND :endDate ORDER BY t.createdAt DESC")
    List<HanaMoneyTransaction> findByUserIdAndDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
    
    // 사용자별 카테고리별 거래 내역 조회
    List<HanaMoneyTransaction> findByUserIdAndCategoryOrderByCreatedAtDesc(Long userId, HanaMoneyTransaction.TransactionCategory category);
    
    // 사용자별 거래 타입별 거래 내역 조회
    List<HanaMoneyTransaction> findByUserIdAndTransactionTypeOrderByCreatedAtDesc(Long userId, HanaMoneyTransaction.TransactionType transactionType);
    
    // 특정 날짜에 이미 출석 체크했는지 확인
    @Query("SELECT COUNT(t) > 0 FROM HanaMoneyTransaction t WHERE t.user.id = :userId AND t.category = 'ATTENDANCE' AND DATE(t.createdAt) = DATE(:date)")
    boolean existsAttendanceByUserIdAndDate(@Param("userId") Long userId, @Param("date") LocalDateTime date);
    
    // 특정 참조 ID로 이미 적립했는지 확인 (중복 적립 방지)
    @Query("SELECT COUNT(t) > 0 FROM HanaMoneyTransaction t WHERE t.user.id = :userId AND t.referenceId = :referenceId AND t.transactionType = 'EARN'")
    boolean existsEarnTransactionByUserIdAndReferenceId(@Param("userId") Long userId, @Param("referenceId") String referenceId);
    
    // 사용자별 월별 적립/사용 통계
    @Query("SELECT SUM(t.amount) FROM HanaMoneyTransaction t WHERE t.user.id = :userId AND t.transactionType = :transactionType AND YEAR(t.createdAt) = :year AND MONTH(t.createdAt) = :month")
    Double getMonthlyTotalByUserIdAndType(
            @Param("userId") Long userId,
            @Param("transactionType") HanaMoneyTransaction.TransactionType transactionType,
            @Param("year") int year,
            @Param("month") int month
    );
} 
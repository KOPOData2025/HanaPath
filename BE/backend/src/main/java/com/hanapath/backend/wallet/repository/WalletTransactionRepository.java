package com.hanapath.backend.wallet.repository;

import com.hanapath.backend.wallet.entity.WalletTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {

    // 사용자별 거래 내역 조회 (페이징)
    Page<WalletTransaction> findByUserIdOrderByTransactionDateDesc(Long userId, Pageable pageable);

    // 사용자별 카테고리별 거래 내역 조회 (페이징)
    Page<WalletTransaction> findByUserIdAndCategoryOrderByTransactionDateDesc(Long userId, String category, Pageable pageable);

    // 사용자별 기간별 거래 내역 조회 (페이징)
    Page<WalletTransaction> findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(
            Long userId, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    // 사용자별 검색어 포함 거래 내역 조회 (페이징)
    @Query("SELECT wt FROM WalletTransaction wt WHERE wt.user.id = :userId AND " +
           "(wt.title LIKE %:searchQuery% OR wt.description LIKE %:searchQuery%) " +
           "ORDER BY wt.transactionDate DESC")
    Page<WalletTransaction> findByUserIdAndSearchQueryOrderByTransactionDateDesc(
            @Param("userId") Long userId, @Param("searchQuery") String searchQuery, Pageable pageable);

    // 사용자별 입금/출금 거래 내역 조회 (페이징)
    Page<WalletTransaction> findByUserIdAndTypeOrderByTransactionDateDesc(Long userId, WalletTransaction.TransactionType type, Pageable pageable);

    // 사용자별 총 입금액 계산
    @Query("SELECT COALESCE(SUM(wt.amount), 0) FROM WalletTransaction wt WHERE wt.user.id = :userId AND wt.amount > 0")
    Double getTotalIncomeByUserId(@Param("userId") Long userId);

    // 사용자별 총 출금액 계산
    @Query("SELECT COALESCE(ABS(SUM(wt.amount)), 0) FROM WalletTransaction wt WHERE wt.user.id = :userId AND wt.amount < 0")
    Double getTotalExpenseByUserId(@Param("userId") Long userId);

    // 사용자별 이번 달 입금액 계산
    @Query("SELECT COALESCE(SUM(wt.amount), 0) FROM WalletTransaction wt WHERE wt.user.id = :userId AND wt.amount > 0 " +
           "AND wt.transactionDate >= :startOfMonth AND wt.transactionDate <= :endOfMonth")
    Double getMonthlyIncomeByUserId(@Param("userId") Long userId, @Param("startOfMonth") LocalDateTime startOfMonth, @Param("endOfMonth") LocalDateTime endOfMonth);

    // 사용자별 이번 달 출금액 계산
    @Query("SELECT COALESCE(ABS(SUM(wt.amount)), 0) FROM WalletTransaction wt WHERE wt.user.id = :userId AND wt.amount < 0 " +
           "AND wt.transactionDate >= :startOfMonth AND wt.transactionDate <= :endOfMonth")
    Double getMonthlyExpenseByUserId(@Param("userId") Long userId, @Param("startOfMonth") LocalDateTime startOfMonth, @Param("endOfMonth") LocalDateTime endOfMonth);

    // 사용자별 거래 내역 개수 조회
    long countByUserId(Long userId);
} 
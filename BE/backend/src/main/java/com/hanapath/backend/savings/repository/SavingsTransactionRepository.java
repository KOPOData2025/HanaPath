package com.hanapath.backend.savings.repository;

import com.hanapath.backend.savings.entity.SavingsTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavingsTransactionRepository extends JpaRepository<SavingsTransaction, Long> {

    // 사용자의 모든 저축 거래 내역 조회
    List<SavingsTransaction> findByUserIdOrderByTransactionDateDesc(Long userId);

    // 특정 목표의 거래 내역 조회
    List<SavingsTransaction> findBySavingsGoalIdOrderByTransactionDateDesc(Long savingsGoalId);

    // 사용자의 특정 목표 거래 내역 조회
    List<SavingsTransaction> findByUserIdAndSavingsGoalIdOrderByTransactionDateDesc(Long userId, Long savingsGoalId);

    // 특정 목표의 저축 횟수 조회
    long countBySavingsGoalId(Long savingsGoalId);
} 
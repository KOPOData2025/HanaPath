package com.hanapath.backend.savings.repository;

import com.hanapath.backend.savings.entity.SavingsGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SavingsGoalRepository extends JpaRepository<SavingsGoal, Long> {

    // 사용자의 모든 목표 조회
    List<SavingsGoal> findByUserIdOrderByCreatedAtDesc(Long userId);

    // 사용자의 활성 목표 조회
    List<SavingsGoal> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, SavingsGoal.GoalStatus status);

    // 특정 납입일에 저축해야 할 목표들 조회
    @Query("SELECT sg FROM SavingsGoal sg WHERE sg.user.id = :userId AND sg.status = 'ACTIVE' AND sg.paymentDay = :paymentDay")
    List<SavingsGoal> findActiveGoalsByPaymentDay(@Param("userId") Long userId, @Param("paymentDay") Integer paymentDay);

    // 목표 완료된 목표들 조회
    List<SavingsGoal> findByUserIdAndStatusOrderByTargetDateAsc(Long userId, SavingsGoal.GoalStatus status);

    // 목표 달성일이 임박한 목표들 조회 (30일 이내)
    @Query("SELECT sg FROM SavingsGoal sg WHERE sg.user.id = :userId AND sg.status = 'ACTIVE' AND sg.targetDate BETWEEN :today AND :thirtyDaysLater")
    List<SavingsGoal> findUpcomingGoals(@Param("userId") Long userId, @Param("today") LocalDate today, @Param("thirtyDaysLater") LocalDate thirtyDaysLater);
} 
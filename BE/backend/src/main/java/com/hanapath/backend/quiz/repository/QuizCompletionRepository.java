package com.hanapath.backend.quiz.repository;

import com.hanapath.backend.quiz.entity.QuizCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface QuizCompletionRepository extends JpaRepository<QuizCompletion, Long> {
    
    // 특정 사용자가 특정 날짜에 퀴즈를 완료했는지 확인
    Optional<QuizCompletion> findByUserIdAndCompletedDate(Long userId, LocalDate completedDate);
    
    // 특정 사용자가 특정 날짜에 퀴즈를 완료했는지 확인 (존재 여부만)
    boolean existsByUserIdAndCompletedDate(Long userId, LocalDate completedDate);
    
    // 특정 사용자의 퀴즈 완료 기록 개수 조회
    long countByUserId(Long userId);
    
    // 특정 사용자의 연속 퀴즈 완료 일수 조회
    @Query("SELECT COUNT(qc) FROM QuizCompletion qc WHERE qc.userId = :userId AND qc.completedDate >= :startDate")
    long countConsecutiveDays(@Param("userId") Long userId, @Param("startDate") LocalDate startDate);
} 
package com.hanapath.backend.quiz.repository;

import com.hanapath.backend.quiz.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    
    // 활성화된 퀴즈 중에서 오늘 날짜에 해당하는 퀴즈 조회 (날짜별 순환)
    @Query("SELECT q FROM Quiz q WHERE q.isActive = true ORDER BY q.id")
    List<Quiz> findAllActiveQuizzes();
    
    // 활성화된 퀴즈 개수 조회
    @Query("SELECT COUNT(q) FROM Quiz q WHERE q.isActive = true")
    long countActiveQuizzes();
    
} 
package com.hanapath.backend.quiz.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_completions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"userId", "completedDate"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class QuizCompletion {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false)
    private Long quizId;
    
    @Column(nullable = false)
    private Boolean userAnswer;
    
    @Column(nullable = false)
    private Boolean isCorrect;
    
    @Column(nullable = false)
    private Integer earnedPoints;
    
    @Column(nullable = false)
    private LocalDate completedDate; // 날짜만 저장 (시간 제외)
    
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
} 
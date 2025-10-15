package com.hanapath.backend.quiz.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "quizzes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Quiz {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 500)
    private String question;
    
    @Column(nullable = false)
    private Boolean answer; // true = O, false = X
    
    @Column(length = 1000)
    private String explanation;
    
    @Column(length = 2000)
    private String difficultTerms; // 어려운 단어 설명 (JSON 형태로 저장)
    
    @Column(nullable = false)
    private Boolean isActive;
    
    @Column(nullable = false)
    private Integer points; // 정답 시 적립 포인트
    
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
} 
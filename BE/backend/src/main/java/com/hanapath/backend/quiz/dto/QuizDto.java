package com.hanapath.backend.quiz.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizDto {
    private Long id;
    private String question;
    private Boolean answer;
    private String explanation;
    private String difficultTerms; // 어려운 단어 설명
    private Integer points;
} 
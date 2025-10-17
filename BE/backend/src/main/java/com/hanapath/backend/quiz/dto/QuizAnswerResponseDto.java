package com.hanapath.backend.quiz.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAnswerResponseDto {
    private Boolean isCorrect;
    private String explanation;
    private String difficultTerms; // 어려운 단어 설명
    private Integer earnedPoints;
    private Boolean isFirstTimeToday; // 오늘 처음 퀴즈를 푸는지 여부
} 
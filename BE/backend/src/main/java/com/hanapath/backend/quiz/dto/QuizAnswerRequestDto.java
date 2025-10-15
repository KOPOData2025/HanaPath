package com.hanapath.backend.quiz.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAnswerRequestDto {
    private Long quizId;
    private Boolean userAnswer; // true = O, false = X
} 
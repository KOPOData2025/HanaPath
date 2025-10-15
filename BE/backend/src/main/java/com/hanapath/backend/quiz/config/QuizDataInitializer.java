package com.hanapath.backend.quiz.config;

import com.hanapath.backend.quiz.entity.Quiz;
import com.hanapath.backend.quiz.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class QuizDataInitializer implements CommandLineRunner {

    private final QuizRepository quizRepository;

    @Override
    public void run(String... args) throws Exception {
        initializeQuizData();
    }

    private void initializeQuizData() {
        // 이미 퀴즈 데이터가 있는지 확인
        if (quizRepository.count() > 0) {
            log.info("이미 퀴즈 데이터가 있습니다! 초기화를 건너뜁니다.");
            return;
        }
        
    }

    private void createQuiz(String question, Boolean answer, String explanation, String difficultTerms, Integer points) {
        Quiz quiz = Quiz.builder()
                .question(question)
                .answer(answer)
                .explanation(explanation)
                .difficultTerms(difficultTerms)
                .isActive(true)
                .points(points)
                .build();
        
        quizRepository.save(quiz);
        log.info("퀴즈 생성: {}", question.substring(0, Math.min(question.length(), 30)) + "...");
    }
} 
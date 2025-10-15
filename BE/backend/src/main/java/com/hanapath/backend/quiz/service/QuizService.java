package com.hanapath.backend.quiz.service;

import com.hanapath.backend.hanamoney.service.HanaMoneyService;
import com.hanapath.backend.quiz.dto.QuizAnswerRequestDto;
import com.hanapath.backend.quiz.dto.QuizAnswerResponseDto;
import com.hanapath.backend.quiz.dto.QuizDto;
import com.hanapath.backend.quiz.dto.QuizStatusDto;
import com.hanapath.backend.quiz.entity.Quiz;
import com.hanapath.backend.quiz.entity.QuizCompletion;
import com.hanapath.backend.quiz.repository.QuizCompletionRepository;
import com.hanapath.backend.quiz.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import com.hanapath.backend.users.entity.ExperienceEvent;
import com.hanapath.backend.users.service.ExperienceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizService {
    
    private final QuizRepository quizRepository;
    private final QuizCompletionRepository quizCompletionRepository;
    private final HanaMoneyService hanaMoneyService;
    private final ExperienceService experienceService;
    
    /**
     * 오늘의 퀴즈 상태 조회
     */
    public QuizStatusDto getTodayQuizStatus(Long userId) {
        LocalDate today = LocalDate.now();
        
        // 오늘 퀴즈 완료 여부 확인
        boolean hasCompletedToday = quizCompletionRepository.existsByUserIdAndCompletedDate(userId, today);
        
        // 오늘의 퀴즈 조회 (날짜별 순환)
        List<Quiz> activeQuizzes = quizRepository.findAllActiveQuizzes();
        Quiz todayQuiz = null;
        
        if (!activeQuizzes.isEmpty()) {
            // 날짜를 기준으로 퀴즈 선택 (매일 다른 퀴즈)
            int dayOfYear = today.getDayOfYear();
            int quizIndex = dayOfYear % activeQuizzes.size();
            todayQuiz = activeQuizzes.get(quizIndex);
        }
        
        QuizDto quizDto = null;
        if (todayQuiz != null) {
            quizDto = QuizDto.builder()
                    .id(todayQuiz.getId())
                    .question(todayQuiz.getQuestion())
                    .points(todayQuiz.getPoints())
                    .build();
        }
        
        return QuizStatusDto.builder()
                .hasCompletedToday(hasCompletedToday)
                .todayQuiz(quizDto)
                .build();
    }
    
    /**
     * 퀴즈 답변 제출 및 처리
     */
    @Transactional
    public QuizAnswerResponseDto submitQuizAnswer(Long userId, QuizAnswerRequestDto request) {
        LocalDate today = LocalDate.now();
        
        // 오늘 이미 퀴즈를 완료했는지 확인
        if (quizCompletionRepository.existsByUserIdAndCompletedDate(userId, today)) {
            throw new IllegalStateException("오늘은 이미 퀴즈를 완료했습니다.");
        }
        
        // 퀴즈 조회
        Quiz quiz = quizRepository.findById(request.getQuizId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 퀴즈입니다."));
        
        // 정답 여부 확인
        boolean isCorrect = quiz.getAnswer().equals(request.getUserAnswer());
        
        // 퀴즈 완료 기록 저장
        QuizCompletion completion = QuizCompletion.builder()
                .userId(userId)
                .quizId(quiz.getId())
                .userAnswer(request.getUserAnswer())
                .isCorrect(isCorrect)
                .earnedPoints(isCorrect ? quiz.getPoints() : 0)
                .completedDate(today)
                .build();
        
        quizCompletionRepository.save(completion);
        
        // 정답인 경우 하나머니 적립 + 경험치 적립
        if (isCorrect) {
            try {
                hanaMoneyService.processQuizReward(userId, quiz.getId().toString(), true);
                log.info("사용자 {} 퀴즈 정답으로 포인트 적립", userId);
            } catch (Exception e) {
                log.error("퀴즈 포인트 적립 실패: {}", e.getMessage());
                // 포인트 적립 실패해도 퀴즈 완료는 기록됨
            }

            try {
                experienceService.awardExp(userId, ExperienceEvent.ExperienceType.QUIZ_CORRECT, quiz.getId().toString());
                log.info("사용자 {} 퀴즈 정답으로 EXP 적립", userId);
            } catch (Exception e) {
                log.error("퀴즈 EXP 적립 실패: {}", e.getMessage());
            }
        }
        
        return QuizAnswerResponseDto.builder()
                .isCorrect(isCorrect)
                .explanation(quiz.getExplanation())
                .difficultTerms(quiz.getDifficultTerms())
                .earnedPoints(isCorrect ? quiz.getPoints() : 0)
                .isFirstTimeToday(true)
                .build();
    }
    
    /**
     * 퀴즈 완료 기록 조회
     */
    public Optional<QuizCompletion> getTodayCompletion(Long userId) {
        LocalDate today = LocalDate.now();
        return quizCompletionRepository.findByUserIdAndCompletedDate(userId, today);
    }
} 
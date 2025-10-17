package com.hanapath.backend.quiz.controller;

import com.hanapath.backend.quiz.dto.QuizAnswerRequestDto;
import com.hanapath.backend.quiz.dto.QuizAnswerResponseDto;
import com.hanapath.backend.quiz.dto.QuizStatusDto;
import com.hanapath.backend.quiz.service.QuizService;
import com.hanapath.backend.users.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
@Slf4j
public class QuizController {
    
    private final QuizService quizService;
    private final JwtUtil jwtUtil;
    
    /**
     * JWT 토큰에서 사용자 ID 추출
     */
    private Long getCurrentUserId(jakarta.servlet.http.HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalStateException("인증 토큰이 없습니다.");
        }

        String jwt = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(jwt);
        
        if (userId == null) {
            throw new IllegalStateException("사용자 ID를 추출할 수 없습니다.");
        }
        
        return userId;
    }
    
    /**
     * 오늘의 퀴즈 상태 조회
     */
    @GetMapping("/today")
    public ResponseEntity<QuizStatusDto> getTodayQuiz(jakarta.servlet.http.HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            QuizStatusDto status = quizService.getTodayQuizStatus(userId);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            log.error("오늘의 퀴즈 조회 실패: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 퀴즈 답변 제출
     */
    @PostMapping("/submit")
    public ResponseEntity<QuizAnswerResponseDto> submitQuizAnswer(
            @RequestBody QuizAnswerRequestDto request,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        try {
            Long userId = getCurrentUserId(httpRequest);
            QuizAnswerResponseDto response = quizService.submitQuizAnswer(userId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            log.warn("퀴즈 제출 실패 (이미 완료): {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (IllegalArgumentException e) {
            log.warn("퀴즈 제출 실패 (잘못된 요청): {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("퀴즈 제출 실패: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
} 
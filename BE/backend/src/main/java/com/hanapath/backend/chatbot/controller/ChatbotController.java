package com.hanapath.backend.chatbot.controller;

import com.hanapath.backend.chatbot.dto.FortuneRequestDto;
import com.hanapath.backend.chatbot.dto.FortuneResponseDto;
import com.hanapath.backend.chatbot.dto.FinancialWordRequestDto;
import com.hanapath.backend.chatbot.dto.FinancialWordResponseDto;
import com.hanapath.backend.chatbot.service.ChatbotFortuneService;
import com.hanapath.backend.chatbot.service.ChatbotFinancialWordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

/**
 * 챗봇 관련 API 컨트롤러
 * 챗봇의 다양한 기능을 제공하는 REST API 엔드포인트
 */
@Slf4j
@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotFortuneService chatbotFortuneService;
    private final ChatbotFinancialWordService chatbotFinancialWordService;

    /**
     * 오늘의 운세 생성 API
     * 사용자의 별자리 정보를 받아서 맞춤 운세를 생성
     * 
     * @param request 운세 요청 정보 (사용자 ID, 별자리, 생년월일)
     * @return 생성된 운세 정보
     */
    @PostMapping("/fortune")
    public ResponseEntity<FortuneResponseDto> generateFortune(@Valid @RequestBody FortuneRequestDto request) {
        try {
            log.info("운세 요청 수신 - 사용자: {}, 별자리: {}", request.getUserId(), request.getZodiacSign());
            
            // 운세 생성 서비스 호출
            FortuneResponseDto fortune = chatbotFortuneService.generateFortune(request);
            
            log.info("운세 응답 전송 - 사용자: {}", request.getUserId());
            return ResponseEntity.ok(fortune);
            
        } catch (Exception e) {
            log.error("운세 생성 중 오류 발생 - 사용자: {}, 오류: {}", request.getUserId(), e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 금융 단어 생성 API
     * 청소년 눈높이에 맞는 금융 단어 생성
     * 
     * @param request 금융 단어 요청 정보 (사용자 ID, 나이, 카테고리)
     * @return 생성된 금융 단어 정보
     */
    @PostMapping("/financial-word")
    public ResponseEntity<FinancialWordResponseDto> generateFinancialWord(@Valid @RequestBody FinancialWordRequestDto request) {
        try {
            log.info("금융 단어 요청 수신 - 사용자: {}, 나이: {}", request.getUserId(), request.getUserAge());
            
            // 금융 단어 생성 서비스 호출
            FinancialWordResponseDto financialWord = chatbotFinancialWordService.generateFinancialWord(request);
            
            log.info("금융 단어 응답 전송 - 사용자: {}, 단어: {}", request.getUserId(), financialWord.getWord());
            return ResponseEntity.ok(financialWord);
            
        } catch (Exception e) {
            log.error("금융 단어 생성 중 오류 발생 - 사용자: {}, 오류: {}", request.getUserId(), e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 챗봇 상태 확인 API (헬스체크)
     * 
     * @return 챗봇 서비스 상태
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        log.info("챗봇 헬스체크 요청");
        return ResponseEntity.ok("챗봇 서비스가 정상적으로 동작 중입니다!");
    }
}

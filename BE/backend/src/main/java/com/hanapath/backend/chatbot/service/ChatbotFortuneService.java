package com.hanapath.backend.chatbot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanapath.backend.chatbot.dto.FortuneRequestDto;
import com.hanapath.backend.chatbot.dto.FortuneResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * 챗봇 운세 생성 서비스
 * 사용자별 맞춤 운세를 생성하는 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotFortuneService {

    @Qualifier("gptRestTemplate")
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${openai.api.key}")
    private String openaiApiKey;

    // OpenAI API 설정 (챗봇 전용)
    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
    private static final String OPENAI_MODEL = "gpt-4o-mini";

    /**
     * 별자리별 이모지 매핑
     */
    private static final Map<String, String> ZODIAC_EMOJIS = Map.ofEntries(
        Map.entry("물병자리", "♒"),
        Map.entry("물고기자리", "♓"),
        Map.entry("양자리", "♈"),
        Map.entry("황소자리", "♉"),
        Map.entry("쌍둥이자리", "♊"),
        Map.entry("게자리", "♋"),
        Map.entry("사자자리", "♌"),
        Map.entry("처녀자리", "♍"),
        Map.entry("천칭자리", "♎"),
        Map.entry("전갈자리", "♏"),
        Map.entry("사수자리", "♐"),
        Map.entry("염소자리", "♑")
    );

    /**
     * 사용자별 맞춤 운세 생성
     * 
     * @param request 운세 요청 정보 (사용자 ID, 별자리, 생년월일)
     * @return 생성된 운세 정보
     */
    public FortuneResponseDto generateFortune(FortuneRequestDto request) {
        try {
            log.info("운세 생성 시작 - 사용자: {}, 별자리: {}", request.getUserId(), request.getZodiacSign());
            
            // API 호출하여 운세 생성
            String gptResponse = callGptApi(request);
            
            // 응답을 파싱하여 FortuneResponseDto로 변환
            FortuneResponseDto fortune = parseGptResponse(gptResponse, request.getZodiacSign());
            
            log.info("운세 생성 완료 - 사용자: {}", request.getUserId());
            return fortune;
            
        } catch (Exception e) {
            log.error("운세 생성 실패 - 사용자: {}, 오류: {}", request.getUserId(), e.getMessage());
            
            // API 호출 실패 시 기본 운세 반환
            return generateDefaultFortune(request.getZodiacSign());
        }
    }

    /**
     * OpenAI GPT API 호출
     * 
     * @param request 운세 요청 정보
     * @return GPT API 응답
     */
    private String callGptApi(FortuneRequestDto request) {
        try {
            // API 요청 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openaiApiKey);

            // 프롬프트 구성
            String prompt = buildFortunePrompt(request);

            // API 요청 본문 구성
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", OPENAI_MODEL);
            requestBody.put("messages", new Object[]{
                Map.of("role", "system", "content", "당신은 14-19세 청소년을 위한 재미있고 교육적인 운세를 제공하는 전문가입니다."),
                Map.of("role", "user", "content", prompt)
            });
            requestBody.put("max_tokens", 500);
            requestBody.put("temperature", 0.8);

            // API 호출
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(OPENAI_API_URL, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            } else {
                throw new RuntimeException("GPT API 호출 실패: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("GPT API 호출 중 오류 발생: {}", e.getMessage());
            throw new RuntimeException("GPT API 호출 실패", e);
        }
    }

    /**
     * 운세 생성을 위한 프롬프트 구성
     * 
     * @param request 운세 요청 정보
     * @return 구성된 프롬프트
     */
    private String buildFortunePrompt(FortuneRequestDto request) {
        return String.format("""
            %s의 오늘의 운세를 생성해주세요.
            
            다음 형식으로 JSON 형태로 응답해주세요:
            {
                "todayFortune": "오늘의 운세 (한 줄로 간단하게)",
                "moneyFortune": "[금전운] "[점수]"점 [간단한 조언]",
                "luckyColor": "[행운의 색상] [색상]",
                "luckyItem": "[행운의 아이템] [아이템]",
                "luckyNumber": "[행운의 숫자] [숫자]",
                "luckyTime": "[행운의 시간] [오전/오후] [정시]",
                "luckyMessage": "[금융 습관 팁]"
            }
            
            요구사항:
            - 14-19세 청소년이 공감할 수 있는 내용으로 작성
            - 각 항목은 한 줄로 간단하게 작성
            - 금전운 점수는 60-95점 사이로 설정
            - 행운의 아이템은 청소년이 쉽게 접할 수 있는 물건으로 설정
            - 행운의 숫자는 1-9 사이로 설정
            - 금융 교육적 요소를 자연스럽게 포함
            - 재미있고 긍정적인 톤으로 작성
            """, request.getZodiacSign());
    }

    /**
     * GPT API 응답을 파싱하여 FortuneResponseDto로 변환
     * 
     * @param gptResponse GPT API 응답
     * @param zodiacSign 별자리
     * @return 파싱된 운세 정보
     */
    private FortuneResponseDto parseGptResponse(String gptResponse, String zodiacSign) {
        try {
            // GPT 응답에서 JSON 부분 추출
            JsonNode responseNode = objectMapper.readTree(gptResponse);
            String content = responseNode.path("choices").path(0).path("message").path("content").asText();
            
            // JSON 부분만 추출 (```json ... ``` 형태일 수 있음)
            String jsonContent = extractJsonFromContent(content);
            
            // JSON 파싱
            JsonNode fortuneNode = objectMapper.readTree(jsonContent);
            
            return FortuneResponseDto.builder()
                .todayFortune(fortuneNode.path("todayFortune").asText())
                .moneyFortune(fortuneNode.path("moneyFortune").asText())
                .luckyColor(fortuneNode.path("luckyColor").asText())
                .luckyItem(fortuneNode.path("luckyItem").asText())
                .luckyNumber(fortuneNode.path("luckyNumber").asText())
                .luckyTime(fortuneNode.path("luckyTime").asText())
                .luckyMessage(fortuneNode.path("luckyMessage").asText())
                .zodiacSign(zodiacSign)
                .zodiacEmoji(ZODIAC_EMOJIS.getOrDefault(zodiacSign, "⭐"))
                .build();
                
        } catch (Exception e) {
            log.error("GPT 응답 파싱 실패: {}", e.getMessage());
            throw new RuntimeException("GPT 응답 파싱 실패", e);
        }
    }

    /**
     * GPT 응답에서 JSON 부분만 추출
     * 
     * @param content GPT 응답 내용
     * @return 추출된 JSON 문자열
     */
    private String extractJsonFromContent(String content) {
        // ```json ... ``` 형태인 경우
        if (content.contains("```json")) {
            int start = content.indexOf("```json") + 7;
            int end = content.indexOf("```", start);
            if (end > start) {
                return content.substring(start, end).trim();
            }
        }
        
        // ``` ... ``` 형태인 경우
        if (content.contains("```")) {
            int start = content.indexOf("```") + 3;
            int end = content.indexOf("```", start);
            if (end > start) {
                return content.substring(start, end).trim();
            }
        }
        
        // JSON이 직접 포함된 경우
        return content.trim();
    }

    /**
     * GPT API 호출 실패 시 기본 운세 생성
     * 
     * @param zodiacSign 별자리
     * @return 기본 운세 정보
     */
    private FortuneResponseDto generateDefaultFortune(String zodiacSign) {
        log.info("기본 운세 생성 - 별자리: {}", zodiacSign);
        
        return FortuneResponseDto.builder()
            .todayFortune("오늘은 작은 선택에서 큰 행운이 따를지도 몰라요")
            .moneyFortune("💰 금전운: 75점 → 오늘은 저축하기 좋은 날이에요")
            .luckyColor("🎨 행운의 색상: 파랑 → 차분함이 도움이 돼요")
            .luckyItem("🗝️ 행운의 아이템: 노트 → 오늘은 기록이 행운을 불러와요")
            .luckyNumber("🎲 행운의 숫자: 7 → 시험 번호표, 대기번호에서 찾아보면 재미있을지도?")
            .luckyTime("🕐 행운의 시간: 오후 2시 → 이 시간에 중요한 결정을 해보세요")
            .luckyMessage("📝 오늘은 작은 소비 대신 저축을 택해봐요!")
            .zodiacSign(zodiacSign)
            .zodiacEmoji(ZODIAC_EMOJIS.getOrDefault(zodiacSign, "⭐"))
            .build();
    }
}

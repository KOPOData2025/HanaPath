package com.hanapath.backend.chatbot.service;

import com.hanapath.backend.chatbot.dto.FinancialWordRequestDto;
import com.hanapath.backend.chatbot.dto.FinancialWordResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

/**
 * 챗봇 금융 단어 서비스
 * 청소년 눈높이에 맞는 금융 단어 생성
 */
@Slf4j
@Service
public class ChatbotFinancialWordService {

    private final WebClient webClient;

    public ChatbotFinancialWordService(@Value("${openai.api.key}") String apiKey) {
        this.webClient = WebClient.builder()
                .baseUrl("https://api.openai.com/v1/chat/completions")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /**
     * 청소년 눈높이에 맞는 금융 단어 생성
     * 
     * @param request 금융 단어 요청 정보
     * @return 생성된 금융 단어 정보
     */
    public FinancialWordResponseDto generateFinancialWord(FinancialWordRequestDto request) {
        try {
            log.info("금융 단어 요청 - 사용자: {}, 나이: {}, 카테고리: {}", 
                    request.getUserId(), request.getUserAge(), request.getCategory());

            // 나이에 따른 난이도 결정
            String difficulty = determineDifficulty(request.getUserAge());
            
            // 프롬프트 생성
            String prompt = createFinancialWordPrompt(request.getUserAge(), difficulty, request.getCategory());
            
            // API 호출
            String response = callGptApi(prompt);
            
            // 응답 파싱
            FinancialWordResponseDto result = parseFinancialWordResponse(response);
            
            log.info("금융 단어 생성 완료 - 단어: {}, 난이도: {}", result.getWord(), result.getDifficulty());
            return result;
            
        } catch (Exception e) {
            log.error("금융 단어 생성 실패 - 사용자: {}, 오류: {}", request.getUserId(), e.getMessage());
            throw new RuntimeException("금융 단어 생성에 실패했습니다: " + e.getMessage());
        }
    }

    /**
     * 나이에 따른 난이도 결정
     */
    private String determineDifficulty(Integer age) {
        if (age >= 14 && age <= 16) {
            return "초급";
        } else if (age >= 17 && age <= 19) {
            return "중급";
        } else {
            return "초급"; // 기본값
        }
    }

    /**
     * 금융 단어 생성용 프롬프트 생성
     */
    private String createFinancialWordPrompt(Integer age, String difficulty, String category) {
        String categoryPrompt = "";
        
        if (category != null && !category.trim().isEmpty()) {
            // 특정 금융 용어에 대한 설명 요청인 경우
            categoryPrompt = String.format("""
                사용자가 '%s'에 대해 궁금해하고 있어요. 
                이 용어에 대해 %d세 청소년이 이해할 수 있도록 자세히 설명해주세요.
                """, category, age);
        } else {
            // 일반적인 금융 단어 요청인 경우
            categoryPrompt = String.format("""
                다음 금융 단어들 중에서 하나를 랜덤하게 선택해서 설명해줘: 복리, 단리, 수익률, 주식, 펀드, 채권, 보험, 신용카드, 대출, 예치, 적금, 예금, 투자, 저축, 자산, 부채, 순자산, 자본, 손익, 손실, 수익, 매수, 매도, 시장가, 호가, 체결, 지정가, 거래, 증권, 코스피, 코스닥, 배당, 배당금, 배당률, PER, PBR, ROE, ROA, EPS, BPS, 시가총액, 유동비율, 부채비율, 자기자본비율, 영업이익, 순이익, 매출, 매출액, 현금, 현금흐름, 재무제표, 손익계산서, 재무상태표, 현금흐름표, 주요지표, 용돈, 계획, 목표, 소비, 절약, 관리
                
                %d세 청소년에게 적합한 금융 단어를 하나 골라서 설명해줘.
                """, age);
        }
        
        return String.format("""
            %s
            
            [요청 조건]
            - %d세 청소년의 눈높이에 맞춰서 설명해줘.
            - 난이도는 '%s' 수준으로 해줘.
            - 어려운 금융 용어를 쉽고 재미있게 설명해줘.
            - 실제 생활에서 접할 수 있는 예시를 들어줘.
            - 친구에게 설명하듯 친근하고 부드러운 말투로 써줘.
            
            [출력 형식]
            JSON 형식으로 출력해줘. 아래 구조를 꼭 지켜줘:
            {
              "word": "금융 단어",
              "definition": "청소년 눈높이에 맞춘 정의",
              "example": "실생활 예시 문장",
              "tip": "학습 팁",
              "relatedWords": "관련 단어들 (쉼표로 구분)"
            }
            
            [예시 출력]
            {
              "word": "복리",
              "definition": "이자가 원금에 다시 붙어서 이자에 이자가 붙는 방식이야. 마치 눈덩이가 굴러가면서 점점 커지는 것처럼, 돈도 시간이 지날수록 더 빨리 늘어나!",
              "example": "만약 10만원을 연 10%% 복리로 3년간 예금하면, 1년 후 11만원, 2년 후 12.1만원, 3년 후 13.31만원이 돼.",
              "tip": "복리의 힘을 이해하려면 작은 금액으로도 장기간 저축해보는 게 좋아!",
              "relatedWords": "단리, 이자, 원금, 예금"
            }
            """, categoryPrompt, age, difficulty);
    }

    /**
     * GPT API 호출
     */
    private String callGptApi(String prompt) {
        try {
            Map<String, Object> requestBody = Map.of(
                    "model", "gpt-4o-mini",
                    "messages", List.of(
                            Map.of("role", "system", "content", prompt)
                    ),
                    "temperature", 0.7
            );

            Map<String, Object> response = webClient.post()
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            String messageContent = (String) ((Map)((Map)((List<?>) response.get("choices")).get(0)).get("message")).get("content");
            log.info("GPT 금융 단어 응답: {}", messageContent);
            
            return messageContent;
            
        } catch (Exception e) {
            log.error("GPT API 호출 실패", e);
            throw new RuntimeException("GPT API 호출에 실패했습니다: " + e.getMessage());
        }
    }

    /**
     * GPT 응답을 FinancialWordResponseDto로 파싱
     */
    private FinancialWordResponseDto parseFinancialWordResponse(String response) {
        try {
            JSONObject obj = new JSONObject(response);
            
            return FinancialWordResponseDto.builder()
                    .word(obj.optString("word", "금융 단어"))
                    .pronunciation(obj.optString("pronunciation", ""))
                    .definition(obj.optString("definition", ""))
                    .example(obj.optString("example", ""))
                    .category(obj.optString("category", ""))
                    .tip(obj.optString("tip", ""))
                    .relatedWords(obj.optString("relatedWords", ""))
                    .build();
                    
        } catch (Exception e) {
            log.error("금융 단어 응답 파싱 실패", e);
            throw new RuntimeException("응답 파싱에 실패했습니다: " + e.getMessage());
        }
    }
}

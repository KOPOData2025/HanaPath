package com.hanapath.backend.news.service.gpt;

import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class GptClient {

    private final WebClient webClient;

    public GptClient(@Value("${openai.api.key}") String apiKey) {
        this.webClient = WebClient.builder()
                .baseUrl("https://api.openai.com/v1/chat/completions")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public GptSummaryResponse summarize(String contentText) {
        if (contentText == null || contentText.trim().isEmpty()) {
            log.warn("contentText가 비어있어 요약 생략");
            return new GptSummaryResponse("요약 생략", "본문 없음");
        }

        log.info("GPT 요약 요청 (본문 {}자)", contentText.length());

        String prompt = """
            당신은 청소년을 위한 뉴스 해설 전문가입니다. 다음 뉴스 기사를 중학생~고등학생이 쉽게 이해할 수 있도록 요약하고 설명해주세요.
            
            [핵심 원칙]
            1. 정확성: 사실에 기반한 정확한 정보 전달
            2. 접근성: 복잡한 개념을 일상 언어로 풀어서 설명
            3. 흥미: 청소년이 관심을 가질 수 있는 관점과 비유 활용
            4. 교육적 가치: 경제/사회 지식 습득에 도움이 되는 설명
            
            [요약(summary) 작성 가이드]
            - 핵심 사실을 3~5문장으로 간결하게 정리
            - "~했다", "~이다" 등으로 작성
            - 시간, 장소, 인물, 주요 수치 등 구체적 정보 포함
            - 경제 용어는 괄호 안에 쉬운 설명 추가 (예: "인플레이션(물가 상승)")
            - 200~400자 내외로 작성
            
            [설명(explanation) 작성 가이드]
            - 반말로 친구에게 설명하는 듯한 친근한 톤
            - "왜 이런 일이 일어났는지" 배경과 원인 설명
            - "이것이 우리에게 어떤 영향을 미치는지" 실생활 연결점 제시
            - 구체적인 비유나 예시 활용 (예: "가계 예산처럼", "학교 급식비처럼")
            - 청소년이 직접 경험할 수 있는 상황으로 설명
            - 400~600자 내외로 작성
            
            [체크리스트]
            ✓ 사실과 의견을 명확히 구분했는가?
            ✓ 전문 용어를 쉽게 풀어서 설명했는가?
            ✓ 청소년의 관심사와 연결지었는가?
            ✓ 부정적 편향 없이 균형잡힌 시각을 제시했는가?
            ✓ 읽는 사람이 "아, 이제 이해했다!"라고 느낄 수 있는가?
            
            [출력 형식]
            반드시 JSON 형식으로 출력하세요:
            {
              "summary": "핵심 요약 (200~400자)",
              "explanation": "친근한 설명 (400~600자)"
            }
            
            [예시 출력]
            {
              "summary": "한국은행이 기준금리를 3.5%로 동결했다. 인플레이션(물가 상승) 둔화와 경제 성장 둔화를 고려한 결정이다. 내년 상반기까지 현재 금리 수준을 유지할 계획이다.",
              "explanation": "기준금리라는 건 시중 은행들이 서로 돈을 빌릴 때 기준이 되는 금리야. 이게 올라가면 우리가 은행에서 돈 빌릴 때 이자도 더 많이 내야 하고, 내리면 이자가 적어져. 한국은행이 이걸 그대로 유지한 이유는 요즘 물가가 좀 잡혀서 급하게 올릴 필요는 없지만, 아직 완전히 안정적이지도 않아서 내릴 수도 없는 상황이야. 마치 시험 점수가 아직 불안정해서 성적표를 바로 내지 않고 좀 더 지켜보는 것과 비슷해. 이 결정으로 우리 같은 일반인들은 당분간 현재 수준의 대출 이자를 유지하게 될 거야."
            }
            """;

        Map<String, Object> requestBody = Map.of(
                "model", "gpt-4o-mini",
                "messages", List.of(
                        Map.of("role", "system", "content", prompt),
                        Map.of("role", "user", "content", contentText)
                ),
                "temperature", 0.7
        );

        try {
            Map<String, Object> response = webClient.post()
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            String messageContent = (String) ((Map)((Map)((List<?>) response.get("choices")).get(0)).get("message")).get("content");
            log.info("GPT 응답 원문: {}", messageContent);

            // JSON 파싱
            JSONObject obj = new JSONObject(messageContent);
            String summary = obj.optString("summary", "요약 없음").trim();
            String explanation = obj.optString("explanation", "해설 없음").trim();

            return new GptSummaryResponse(summary, explanation);

        } catch (WebClientResponseException.TooManyRequests e) {
            log.warn("GPT 429 오류: 너무 많은 요청. 1.5초 후 재시도...");
            try {
                Thread.sleep(1500);
            } catch (InterruptedException ignored) {}
            return summarize(contentText);  // 재귀 1회 재시도
        } catch (Exception e) {
            log.error("GPT 요청 실패", e);
            return new GptSummaryResponse("요약 실패", "해설 실패");
        }
    }
}

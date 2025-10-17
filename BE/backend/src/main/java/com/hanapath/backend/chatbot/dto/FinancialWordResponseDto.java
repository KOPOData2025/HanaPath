package com.hanapath.backend.chatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 금융 단어 응답 DTO
 * 챗봇에서 청소년 눈높이에 맞는 금융 단어를 응답할 때 사용
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialWordResponseDto {
    
    private String word; // 금융 단어
    private String pronunciation; 
    private String definition; // 정의 (청소년 눈높이에 맞춘 설명)
    private String example; // 예시 문장
    private String category; // 카테고리 (예: "투자", "저축", "신용카드")
    private String difficulty; // 난이도 (예: "초급", "중급", "고급")
    private String tip; // 학습 팁
    private String relatedWords; // 관련 단어들
}






package com.hanapath.backend.chatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;

/**
 * 금융 단어 요청 DTO
 * 챗봇에서 청소년 눈높이에 맞는 금융 단어를 요청할 때 사용
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialWordRequestDto {
    
    @NotNull(message = "사용자 ID는 필수입니다")
    private Long userId;
    
    @NotNull(message = "사용자 나이는 필수입니다")
    private Integer userAge;
    
    private String category; // 선택적 카테고리 (예: "투자", "저축", "신용카드" 등)
}






package com.hanapath.backend.chatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 챗봇 운세 응답 DTO
 * 생성된 운세 정보를 프론트엔드로 전달하기 위한 응답 데이터
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FortuneResponseDto {
    
    /**
     * 오늘의 운세 (한 줄 메시지)
     */
    private String todayFortune;
    
    /**
     * 금전운 (점수 + 간단한 조언)
     */
    private String moneyFortune;
    
    /**
     * 행운의 색상 (색상 + 이유)
     */
    private String luckyColor;
    
    /**
     * 행운의 아이템 (아이템 + 이유)
     */
    private String luckyItem;
    
    /**
     * 행운의 숫자 (숫자 + 실생활 연관성)
     */
    private String luckyNumber;
    
    /**
     * 행운의 시간 (시간 + 이유)
     */
    private String luckyTime;
    
    /**
     * 행운의 한마디 (금융 습관 팁)
     */
    private String luckyMessage;
    
    /**
     * 사용자 별자리
     */
    private String zodiacSign;
    
    /**
     * 별자리 이모지
     */
    private String zodiacEmoji;
}

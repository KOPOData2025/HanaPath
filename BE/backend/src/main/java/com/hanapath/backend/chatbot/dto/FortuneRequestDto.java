package com.hanapath.backend.chatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 챗봇 운세 요청 DTO
 * 사용자의 별자리 정보를 받아, 운세를 생성하기 위한 요청 데이터
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FortuneRequestDto {
    
    /**
     * 사용자 ID
     */
    private Long userId;
    
    /**
     * 사용자 별자리 (예: "물병자리", "양자리" 등)
     */
    private String zodiacSign;
    
    /**
     * 사용자 생년월일 (YYYY-MM-DD 형식)
     */
    private String birthDate;
}

package com.hanapath.backend.hanamoney.service;

import com.hanapath.backend.hanamoney.dto.HanaMoneyTransactionDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class HanaMoneyIntegrationService {

    private final HanaMoneyService hanaMoneyService;

    /**
     * 출석 체크 시 하나머니 적립
     */
    public HanaMoneyTransactionDto rewardAttendanceCheck(Long userId) {
        try {
            return hanaMoneyService.processAttendanceCheck(userId);
        } catch (Exception e) {
            log.error("출석 체크 보상 처리 실패: userId={}, error={}", userId, e.getMessage());
            throw e;
        }
    }

    /**
     * 퀴즈 정답 시 하나머니 적립
     */
    public HanaMoneyTransactionDto rewardQuizCorrect(Long userId, String quizId) {
        try {
            return hanaMoneyService.processQuizReward(userId, quizId, true);
        } catch (Exception e) {
            log.error("퀴즈 정답 보상 처리 실패: userId={}, quizId={}, error={}", userId, quizId, e.getMessage());
            throw e;
        }
    }

    /**
     * 뉴스 읽기 시 하나머니 적립
     */
    public HanaMoneyTransactionDto rewardNewsRead(Long userId, String newsId) {
        try {
            return hanaMoneyService.processNewsReadReward(userId, newsId);
        } catch (Exception e) {
            log.error("뉴스 읽기 보상 처리 실패: userId={}, newsId={}, error={}", userId, newsId, e.getMessage());
            throw e;
        }
    }

    /**
     * 스토어 상품 구매 시 하나머니 차감
     */
    public HanaMoneyTransactionDto processStorePurchase(Long userId, String productId, BigDecimal price, String productName) {
        try {
            return hanaMoneyService.processStorePurchase(userId, productId, price, productName);
        } catch (Exception e) {
            log.error("스토어 구매 처리 실패: userId={}, productId={}, error={}", userId, productId, e.getMessage());
            throw e;
        }
    }

    /**
     * 친구 초대 시 하나머니 적립
     */
    public HanaMoneyTransactionDto rewardFriendInvite(Long userId, String inviteCode) {
        try {
            return hanaMoneyService.processTransaction(
                    com.hanapath.backend.hanamoney.dto.HanaMoneyRequestDto.builder()
                            .userId(userId)
                            .transactionType("EARN")
                            .category("INVITE")
                            .amount(new BigDecimal("100"))
                            .description("친구 초대 보상")
                            .referenceId("INVITE_" + inviteCode)
                            .build()
            );
        } catch (Exception e) {
            log.error("친구 초대 보상 처리 실패: userId={}, inviteCode={}, error={}", userId, inviteCode, e.getMessage());
            throw e;
        }
    }

    /**
     * 이벤트 참여 시 하나머니 적립
     */
    public HanaMoneyTransactionDto rewardEventParticipation(Long userId, String eventId, String eventName) {
        try {
            return hanaMoneyService.processTransaction(
                    com.hanapath.backend.hanamoney.dto.HanaMoneyRequestDto.builder()
                            .userId(userId)
                            .transactionType("EARN")
                            .category("EVENT")
                            .amount(new BigDecimal("200"))
                            .description(eventName + " 이벤트 참여")
                            .referenceId("EVENT_" + eventId)
                            .build()
            );
        } catch (Exception e) {
            log.error("이벤트 참여 보상 처리 실패: userId={}, eventId={}, error={}", userId, eventId, e.getMessage());
            throw e;
        }
    }

    /**
     * 연속 출석 보상 (주간/월간)
     */
    public HanaMoneyTransactionDto rewardConsecutiveAttendance(Long userId, int consecutiveDays) {
        try {
            String category;
            BigDecimal amount;
            String description;

            if (consecutiveDays == 7) {
                category = "WEEKLY";
                amount = new BigDecimal("100");
                description = "7일 연속 출석 보상";
            } else if (consecutiveDays == 30) {
                category = "MONTHLY";
                amount = new BigDecimal("500");
                description = "30일 연속 출석 보상";
            } else {
                throw new IllegalArgumentException("지원하지 않는 연속 출석 일수입니다: " + consecutiveDays);
            }

            return hanaMoneyService.processTransaction(
                    com.hanapath.backend.hanamoney.dto.HanaMoneyRequestDto.builder()
                            .userId(userId)
                            .transactionType("EARN")
                            .category(category)
                            .amount(amount)
                            .description(description)
                            .referenceId("CONSECUTIVE_" + consecutiveDays + "_" + System.currentTimeMillis())
                            .build()
            );
        } catch (Exception e) {
            log.error("연속 출석 보상 처리 실패: userId={}, consecutiveDays={}, error={}", userId, consecutiveDays, e.getMessage());
            throw e;
        }
    }

    /**
     * 일일/주간/월간 퀴즈 완료 보상
     */
    public HanaMoneyTransactionDto rewardQuizCompletion(Long userId, String quizType, String quizId) {
        try {
            String category;
            BigDecimal amount;
            String description;

            switch (quizType.toLowerCase()) {
                case "daily":
                    category = "DAILY";
                    amount = new BigDecimal("30");
                    description = "일일 퀴즈 완료";
                    break;
                case "weekly":
                    category = "WEEKLY";
                    amount = new BigDecimal("200");
                    description = "주간 퀴즈 완료";
                    break;
                case "monthly":
                    category = "MONTHLY";
                    amount = new BigDecimal("1000");
                    description = "월간 퀴즈 완료";
                    break;
                default:
                    throw new IllegalArgumentException("지원하지 않는 퀴즈 타입입니다: " + quizType);
            }

            return hanaMoneyService.processTransaction(
                    com.hanapath.backend.hanamoney.dto.HanaMoneyRequestDto.builder()
                            .userId(userId)
                            .transactionType("EARN")
                            .category(category)
                            .amount(amount)
                            .description(description)
                            .referenceId("QUIZ_COMPLETION_" + quizType + "_" + quizId)
                            .build()
            );
        } catch (Exception e) {
            log.error("퀴즈 완료 보상 처리 실패: userId={}, quizType={}, quizId={}, error={}", userId, quizType, quizId, e.getMessage());
            throw e;
        }
    }
} 
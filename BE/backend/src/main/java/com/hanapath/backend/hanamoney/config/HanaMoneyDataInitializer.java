package com.hanapath.backend.hanamoney.config;

import com.hanapath.backend.hanamoney.entity.HanaMoneyConfig;
import com.hanapath.backend.hanamoney.repository.HanaMoneyConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class HanaMoneyDataInitializer implements CommandLineRunner {

    private final HanaMoneyConfigRepository configRepository;

    @Override
    public void run(String... args) throws Exception {
        initializeHanaMoneyConfigs();
    }

    private void initializeHanaMoneyConfigs() {
        // 기존 설정이 없을 때만 초기화
        if (configRepository.count() == 0) {
            log.info("하나머니 설정 초기화를 시작합니다...");

            // 일일 출석 체크
            createConfigIfNotExists(
                    HanaMoneyConfig.ConfigType.DAILY_ATTENDANCE,
                    new BigDecimal("50"),
                    "일일 출석 체크 시 적립되는 포인트"
            );

            // 주간 출석 체크 (7일 연속)
            createConfigIfNotExists(
                    HanaMoneyConfig.ConfigType.WEEKLY_ATTENDANCE,
                    new BigDecimal("100"),
                    "7일 연속 출석 체크 시 추가 적립되는 포인트"
            );

            // 월간 출석 체크 (30일 연속)
            createConfigIfNotExists(
                    HanaMoneyConfig.ConfigType.MONTHLY_ATTENDANCE,
                    new BigDecimal("500"),
                    "30일 연속 출석 체크 시 추가 적립되는 포인트"
            );

            // 퀴즈 정답
            createConfigIfNotExists(
                    HanaMoneyConfig.ConfigType.QUIZ_CORRECT,
                    new BigDecimal("50"),
                    "퀴즈 정답 시 적립되는 포인트"
            );

            // 뉴스 읽기
            createConfigIfNotExists(
                    HanaMoneyConfig.ConfigType.NEWS_READ,
                    new BigDecimal("50"),
                    "뉴스 읽기 시 적립되는 포인트"
            );

            // 친구 초대
            createConfigIfNotExists(
                    HanaMoneyConfig.ConfigType.FRIEND_INVITE,
                    new BigDecimal("100"),
                    "친구 초대 시 적립되는 포인트"
            );

            // 일일 퀴즈
            createConfigIfNotExists(
                    HanaMoneyConfig.ConfigType.DAILY_QUIZ,
                    new BigDecimal("50"),
                    "일일 퀴즈 완료 시 적립되는 포인트"
            );

            // 주간 퀴즈
            createConfigIfNotExists(
                    HanaMoneyConfig.ConfigType.WEEKLY_QUIZ,
                    new BigDecimal("200"),
                    "주간 퀴즈 완료 시 적립되는 포인트"
            );

            // 월간 퀴즈
            createConfigIfNotExists(
                    HanaMoneyConfig.ConfigType.MONTHLY_QUIZ,
                    new BigDecimal("1000"),
                    "월간 퀴즈 완료 시 적립되는 포인트"
            );

            // 이벤트 참여
            createConfigIfNotExists(
                    HanaMoneyConfig.ConfigType.EVENT_PARTICIPATION,
                    new BigDecimal("200"),
                    "이벤트 참여 시 적립되는 포인트"
            );

            // 스토어 구매 (수수료)
            createConfigIfNotExists(
                    HanaMoneyConfig.ConfigType.STORE_PURCHASE,
                    new BigDecimal("0"),
                    "스토어 구매 시 차감되는 포인트 (실제 상품 가격만큼 차감)"
            );

            // 계좌 이체 (수수료)
            createConfigIfNotExists(
                    HanaMoneyConfig.ConfigType.ACCOUNT_TRANSFER,
                    new BigDecimal("0"),
                    "계좌 이체 시 차감되는 포인트 (실제 이체 금액만큼 차감)"
            );

            log.info("하나머니 설정 초기화가 완료되었습니다.");
        } else {
            // 기존 설정이 있는 경우 뉴스 읽기 포인트 업데이트
            updateNewsReadConfig();
        }
    }

    /**
     * 기존 뉴스 읽기 설정을 50P로 업데이트
     */
    private void updateNewsReadConfig() {
        configRepository.findByConfigType(HanaMoneyConfig.ConfigType.NEWS_READ)
                .ifPresent(existingConfig -> {
                    if (existingConfig.getAmount().compareTo(new BigDecimal("50")) != 0) {
                        existingConfig.setAmount(new BigDecimal("50"));
                        existingConfig.setDescription("뉴스 읽기 시 적립되는 포인트");
                        configRepository.save(existingConfig);
                        log.info("뉴스 읽기 포인트가 50P로 업데이트되었습니다.");
                    }
                });
    }

    private void createConfigIfNotExists(HanaMoneyConfig.ConfigType configType, BigDecimal amount, String description) {
        if (!configRepository.findByConfigType(configType).isPresent()) {
            HanaMoneyConfig config = HanaMoneyConfig.builder()
                    .configType(configType)
                    .amount(amount)
                    .description(description)
                    .isActive(true)
                    .conditions("{}")
                    .build();
            
            configRepository.save(config);
            log.info("하나머니 설정 생성: {} = {}P", configType.getDescription(), amount);
        }
    }
} 
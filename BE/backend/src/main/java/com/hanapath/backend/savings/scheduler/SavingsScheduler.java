package com.hanapath.backend.savings.scheduler;

import com.hanapath.backend.savings.service.SavingsService;
import com.hanapath.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class SavingsScheduler {

    private final SavingsService savingsService;
    private final UserRepository userRepository;

    // 매일 자정에 실행하여 해당 날짜의 납입일을 가진 목표들의 저축을 실행
    @Scheduled(cron = "0 00 00 * * ?") //
    public void executeDailySavings() {
        LocalDate today = LocalDate.now();
        int todayDay = today.getDayOfMonth();
        
        log.info("일일 저축 실행 시작 - 납입일: {}", todayDay);
        
        try {
            // 모든 사용자에 대해 해당 납입일의 목표들을 찾아서 저축 실행
            List<Long> userIds = userRepository.findAllUserIds();
            
            for (Long userId : userIds) {
                try {
                    savingsService.executeMonthlySavings(userId, todayDay);
                    log.info("사용자 {}의 저축 실행 완료", userId);
                } catch (Exception e) {
                    log.error("사용자 {}의 저축 실행 중 오류 발생: {}", userId, e.getMessage());
                }
            }
            
            log.info("일일 저축 실행 완료 - 납입일: {}", todayDay);
        } catch (Exception e) {
            log.error("일일 저축 실행 중 오류 발생: {}", e.getMessage(), e);
        }
    }

    // 매월 1일 자정에 실행하여 월별 저축 통계 업데이트
    @Scheduled(cron = "0 0 0 1 * ?") // 매월 1일 자정
    public void updateMonthlySavingsStats() {
        log.info("월별 저축 통계 업데이트 시작");
        
        try {
            // 월별 저축 통계 업데이트 로직
            // 예: 월별 저축 목표 달성률, 총 저축액 등
            log.info("월별 저축 통계 업데이트 완료");
        } catch (Exception e) {
            log.error("월별 저축 통계 업데이트 중 오류 발생: {}", e.getMessage(), e);
        }
    }
} 
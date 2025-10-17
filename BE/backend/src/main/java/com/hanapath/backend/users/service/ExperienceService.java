package com.hanapath.backend.users.service;

import com.hanapath.backend.users.entity.ExperienceEvent;
import com.hanapath.backend.users.entity.User;
import com.hanapath.backend.users.repository.ExperienceEventRepository;
import com.hanapath.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.Getter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExperienceService {

    private final ExperienceEventRepository experienceEventRepository;
    private final UserRepository userRepository;

    // 레벨 구간 정의 
    private static final LinkedHashMap<Integer, Integer> LEVEL_THRESHOLDS = new LinkedHashMap<>() {{
        put(1, 0);
        put(2, 300);
        put(3, 900);
        put(4, 1800);
        put(5, 3000);
    }};

    // 이벤트별 EXP 값 및 일일 한도
    private static final Map<ExperienceEvent.ExperienceType, Integer> EXP_VALUES = Map.of(
            ExperienceEvent.ExperienceType.DAILY_ATTENDANCE, 20,
            ExperienceEvent.ExperienceType.QUIZ_CORRECT, 50,
            ExperienceEvent.ExperienceType.NEWS_READ, 10,
            ExperienceEvent.ExperienceType.COMMUNITY_POST, 30,
            ExperienceEvent.ExperienceType.COMMUNITY_COMMENT, 10,
            ExperienceEvent.ExperienceType.SAVINGS_GOAL_COMPLETED, 100,
            ExperienceEvent.ExperienceType.FRIEND_INVITE, 200,
            ExperienceEvent.ExperienceType.STORE_PURCHASE, 20
    );

    private static final Map<ExperienceEvent.ExperienceType, Integer> DAILY_LIMITS = Map.of(
            ExperienceEvent.ExperienceType.DAILY_ATTENDANCE, 1,
            ExperienceEvent.ExperienceType.QUIZ_CORRECT, 1,
            ExperienceEvent.ExperienceType.NEWS_READ, 5,
            ExperienceEvent.ExperienceType.COMMUNITY_POST, 2,
            ExperienceEvent.ExperienceType.COMMUNITY_COMMENT, 10,
            ExperienceEvent.ExperienceType.SAVINGS_GOAL_COMPLETED, Integer.MAX_VALUE,
            ExperienceEvent.ExperienceType.FRIEND_INVITE, Integer.MAX_VALUE,
            ExperienceEvent.ExperienceType.STORE_PURCHASE, 1
    );

    @Transactional
    public AwardResult awardExp(Long userId, ExperienceEvent.ExperienceType type, String sourceId) {
        LocalDate today = LocalDate.now();
        String idempotencyKey = buildIdempotencyKey(userId, type, sourceId, today);

        int dailyLimit = DAILY_LIMITS.getOrDefault(type, 0);
        if (dailyLimit == 0) {
            return AwardResult.skipped("이벤트 한도가 0입니다");
        }

        // 중복 적립 방지 키 체크
        if (experienceEventRepository.existsByIdempotencyKey(idempotencyKey)) {
            return AwardResult.skipped("이미 처리된 이벤트입니다");
        }

        // 일일 한도 체크
        int countToday = experienceEventRepository.countByUser_IdAndTypeAndEventDate(userId, type, today);
        if (countToday >= dailyLimit) {
            return AwardResult.skipped("일일 한도를 초과했습니다");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        int exp = EXP_VALUES.getOrDefault(type, 0);
        int beforeLevel = safe(user.getLevel(), 1);
        int totalExp = safe(user.getTotalExp(), 0) + exp;
        int afterLevel = calculateLevel(totalExp);

        user.setTotalExp(totalExp);
        user.setLevel(afterLevel);
        userRepository.save(user);

        ExperienceEvent event = ExperienceEvent.builder()
                .user(user)
                .type(type)
                .exp(exp)
                .sourceId(sourceId)
                .idempotencyKey(idempotencyKey)
                .eventDate(today)
                .build();

        experienceEventRepository.save(event);

        return new AwardResult(true, afterLevel > beforeLevel, exp, totalExp, afterLevel, null);
    }

    private String buildIdempotencyKey(Long userId, ExperienceEvent.ExperienceType type, String sourceId, LocalDate date) {
        String source = sourceId == null ? "" : (":" + sourceId);
        return userId + ":" + type.name() + ":" + date + source;
    }

    private int calculateLevel(int totalExp) {
        int level = 1;
        for (Map.Entry<Integer, Integer> entry : LEVEL_THRESHOLDS.entrySet()) {
            if (totalExp >= entry.getValue()) {
                level = entry.getKey();
            } else {
                break;
            }
        }
        return level;
    }

    private int safe(Integer value, int defaultValue) {
        return value == null ? defaultValue : value;
    }

    @Getter
    @RequiredArgsConstructor
    public static class AwardResult {
        private final boolean success;
        private final boolean leveledUp;
        private final int earnedExp;
        private final int newTotalExp;
        private final int newLevel;
        private final String skippedReason;

        public static AwardResult skipped(String reason) {
            return new AwardResult(false, false, 0, 0, 0, reason);
        }
    }
}



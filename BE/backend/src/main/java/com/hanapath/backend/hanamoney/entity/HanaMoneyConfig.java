package com.hanapath.backend.hanamoney.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "hana_money_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HanaMoneyConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private ConfigType configType; // 설정 타입

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount; // 포인트 금액

    @Column(nullable = false)
    private String description; // 설정 설명

    @Column(nullable = false)
    private boolean isActive; // 활성화 여부

    @Column(length = 500)
    private String conditions; 

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // 설정 타입 열거형
    public enum ConfigType {
        SIGNUP_BONUS("회원가입 보너스"),
        DAILY_ATTENDANCE("일일 출석"),
        WEEKLY_ATTENDANCE("주간 출석"),
        MONTHLY_ATTENDANCE("월간 출석"),
        QUIZ_CORRECT("퀴즈 정답"),
        NEWS_READ("뉴스 읽기"),
        FRIEND_INVITE("친구 초대"),
        DAILY_QUIZ("일일 퀴즈"),
        WEEKLY_QUIZ("주간 퀴즈"),
        MONTHLY_QUIZ("월간 퀴즈"),
        EVENT_PARTICIPATION("이벤트 참여"),
        STORE_PURCHASE("스토어 구매"),
        ACCOUNT_TRANSFER("계좌 이체");

        private final String description;

        ConfigType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
} 
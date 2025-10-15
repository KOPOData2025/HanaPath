package com.hanapath.backend.users.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "experience_events", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"idempotencyKey"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExperienceEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ExperienceType type;

    @Column(nullable = false)
    private Integer exp; // 적립된 경험치

    @Column(length = 100)
    private String sourceId; // 관련 ID(예: quizId 등)

    @Column(nullable = false, length = 150)
    private String idempotencyKey; // 중복 적립 방지 키

    @Column(nullable = false)
    private LocalDate eventDate; // 이벤트 기준일(일 단위)

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum ExperienceType {
        DAILY_ATTENDANCE,
        QUIZ_CORRECT,
        NEWS_READ,
        COMMUNITY_POST,
        COMMUNITY_COMMENT,
        SAVINGS_GOAL_COMPLETED,
        FRIEND_INVITE,
        STORE_PURCHASE
    }
}



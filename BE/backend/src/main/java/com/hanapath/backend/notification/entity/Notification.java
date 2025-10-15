package com.hanapath.backend.notification.entity;

import com.hanapath.backend.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // 알림을 받을 사용자

    @Column(nullable = false)
    private String title; // 알림 제목

    @Column(nullable = false, length = 500)
    private String description; // 알림 내용

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type; // 알림 타입

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationCategory category; // 알림 카테고리

    @Column(nullable = false)
    private Boolean isRead = false; // 읽음 여부

    @Column
    private String relatedData; // 관련 데이터 (JSON 형태로 저장)

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum NotificationType {
        RELATIONSHIP_REQUEST,    // 관계 요청
        RELATIONSHIP_APPROVED,   // 관계 승인
        RELATIONSHIP_REJECTED,   // 관계 거절
        GIFT_RECEIVED,          // 기프티콘 수령
        SAVINGS_GOAL,           // 저축 목표 달성
        ALLOWANCE_RECEIVED,     // 용돈 수령
        OTHER                   // 기타
    }

    public enum NotificationCategory {
        RELATIONSHIP,   // 관계
        GIFT,          // 기프티콘
        SAVINGS,       // 저축/용돈
        OTHER          // 기타
    }
}

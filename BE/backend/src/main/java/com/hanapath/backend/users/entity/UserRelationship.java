package com.hanapath.backend.users.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_relationships")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRelationship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester; // 요청자

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver; // 수신자

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RelationshipStatus status; // PENDING, ACCEPTED, REJECTED

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RelationshipType type; // PARENT_CHILD, SIBLING, FRIEND

    @Column(length = 100)
    private String message; // 요청 메시지

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum RelationshipStatus {
        PENDING,    // 대기중
        ACCEPTED,   // 승인됨
        REJECTED    // 거절됨
    }

    public enum RelationshipType {
        PARENT_CHILD, // 부모-자식
        SIBLING,      // 형제자매
        FRIEND        // 친구
    }
} 
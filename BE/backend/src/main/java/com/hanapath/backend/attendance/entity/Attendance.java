package com.hanapath.backend.attendance.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @Column(name = "points_earned", nullable = false)
    private Integer pointsEarned;

    @Column(name = "bonus_multiplier")
    private Integer bonusMultiplier;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreatedDate
    private LocalDateTime createdAt;

    // 복합 유니크 제약조건: 한 사용자가 같은 날에 중복 출석할 수 없음
    @Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "attendance_date"})
    })
    public static class AttendanceTable {}
} 
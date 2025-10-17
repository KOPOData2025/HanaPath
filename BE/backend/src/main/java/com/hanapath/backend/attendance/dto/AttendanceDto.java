package com.hanapath.backend.attendance.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

public class AttendanceDto {

    @Getter @Setter @Builder
    @AllArgsConstructor @NoArgsConstructor
    public static class AttendanceResponse {
        private Long id;
        private Long userId;
        private LocalDate attendanceDate;
        private Integer pointsEarned;
        private Integer bonusMultiplier;
        private String message;
    }

    @Getter @Setter @Builder
    @AllArgsConstructor @NoArgsConstructor
    public static class MonthlyAttendanceResponse {
        private Integer year;
        private Integer month;
        private List<Integer> attendedDays;
        private Integer totalPoints;
        private Integer consecutiveDays;
        private Boolean todayAttended;
    }

    @Getter @Setter @Builder
    @AllArgsConstructor @NoArgsConstructor
    public static class AttendanceStatsResponse {
        private Integer totalAttendanceDays;
        private Integer currentMonthPoints;
        private Integer consecutiveDays;
        private Integer totalPoints;
    }

    @Getter @Setter @Builder
    @AllArgsConstructor @NoArgsConstructor
    public static class CheckInRequest {
        private Long userId;
    }
} 
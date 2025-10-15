package com.hanapath.backend.attendance.controller;

import com.hanapath.backend.attendance.dto.AttendanceDto;
import com.hanapath.backend.attendance.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@Slf4j
public class AttendanceController {

    private final AttendanceService attendanceService;

    /**
     * 출석체크
     */
    @PostMapping("/check-in")
    public ResponseEntity<AttendanceDto.AttendanceResponse> checkIn(@RequestParam Long userId) {
        try {
            AttendanceDto.AttendanceResponse response = attendanceService.checkIn(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("출석체크 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(
                AttendanceDto.AttendanceResponse.builder()
                    .message("출석체크 중 오류가 발생했습니다.")
                    .build()
            );
        }
    }

    /**
     * 월별 출석 데이터 조회
     */
    @GetMapping("/monthly/{userId}")
    public ResponseEntity<AttendanceDto.MonthlyAttendanceResponse> getMonthlyAttendance(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().getYear()}") int year,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().getMonthValue()}") int month) {
        try {
            AttendanceDto.MonthlyAttendanceResponse response = attendanceService.getMonthlyAttendance(userId, year, month);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("월별 출석 데이터 조회 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 출석 통계 조회
     */
    @GetMapping("/stats/{userId}")
    public ResponseEntity<AttendanceDto.AttendanceStatsResponse> getAttendanceStats(@PathVariable Long userId) {
        try {
            AttendanceDto.AttendanceStatsResponse response = attendanceService.getAttendanceStats(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("출석 통계 조회 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 오늘 출석 여부 확인
     */
    @GetMapping("/today/{userId}")
    public ResponseEntity<Boolean> checkTodayAttendance(@PathVariable Long userId) {
        try {
            LocalDate today = LocalDate.now();
            boolean todayAttended = attendanceService.getMonthlyAttendance(
                userId, today.getYear(), today.getMonthValue()
            ).getTodayAttended();
            return ResponseEntity.ok(todayAttended);
        } catch (Exception e) {
            log.error("오늘 출석 여부 확인 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
} 
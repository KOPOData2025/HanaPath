package com.hanapath.backend.attendance.service;

import com.hanapath.backend.attendance.dto.AttendanceDto;
import com.hanapath.backend.attendance.entity.Attendance;
import com.hanapath.backend.attendance.repository.AttendanceRepository;
import lombok.RequiredArgsConstructor;
import com.hanapath.backend.users.entity.ExperienceEvent;
import com.hanapath.backend.users.service.ExperienceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final ExperienceService experienceService;

    // 기본 출석 포인트
    private static final int BASE_POINTS = 50;

    /**
     * 출석체크
     */
    @Transactional
    public AttendanceDto.AttendanceResponse checkIn(Long userId) {
        LocalDate today = LocalDate.now();
        
        // 이미 오늘 출석했는지 확인
        if (attendanceRepository.findByUserIdAndAttendanceDate(userId, today).isPresent()) {
            return AttendanceDto.AttendanceResponse.builder()
                    .message("이미 오늘 출석체크를 완료했습니다.")
                    .build();
        }

        // 출석 기록 저장 (항상 50P 적립)
        int pointsEarned = BASE_POINTS;

        Attendance attendance = Attendance.builder()
                .userId(userId)
                .attendanceDate(today)
                .pointsEarned(pointsEarned)
                .bonusMultiplier(1)
                .createdAt(LocalDateTime.now())
                .build();

        Attendance savedAttendance = attendanceRepository.save(attendance);

        // EXP 적립 (일일 출석 1회/일)
        experienceService.awardExp(userId, ExperienceEvent.ExperienceType.DAILY_ATTENDANCE, today.toString());

        String message = String.format("하나머니 %dP가 적립되었습니다!", pointsEarned);

        return AttendanceDto.AttendanceResponse.builder()
                .id(savedAttendance.getId())
                .userId(savedAttendance.getUserId())
                .attendanceDate(savedAttendance.getAttendanceDate())
                .pointsEarned(savedAttendance.getPointsEarned())
                .bonusMultiplier(savedAttendance.getBonusMultiplier())
                .message(message)
                .build();
    }

    /**
     * 월별 출석 데이터 조회
     */
    public AttendanceDto.MonthlyAttendanceResponse getMonthlyAttendance(Long userId, int year, int month) {
        List<Attendance> attendances = attendanceRepository.findByUserIdAndYearAndMonth(userId, year, month);
        
        List<Integer> attendedDays = attendances.stream()
                .map(attendance -> attendance.getAttendanceDate().getDayOfMonth())
                .collect(Collectors.toList());

        int totalPoints = attendances.stream()
                .mapToInt(Attendance::getPointsEarned)
                .sum();

        int consecutiveDays = calculateConsecutiveDays(userId);
        boolean todayAttended = attendanceRepository.findByUserIdAndAttendanceDate(userId, LocalDate.now()).isPresent();

        return AttendanceDto.MonthlyAttendanceResponse.builder()
                .year(year)
                .month(month)
                .attendedDays(attendedDays)
                .totalPoints(totalPoints)
                .consecutiveDays(consecutiveDays)
                .todayAttended(todayAttended)
                .build();
    }

    /**
     * 출석 통계 조회
     */
    public AttendanceDto.AttendanceStatsResponse getAttendanceStats(Long userId) {
        int totalAttendanceDays = attendanceRepository.countByUserId(userId).intValue();
        int consecutiveDays = calculateConsecutiveDays(userId);
        
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate endOfMonth = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());
        
        int currentMonthPoints = attendanceRepository.sumPointsByUserIdAndDateRange(userId, startOfMonth, endOfMonth);
        int totalPoints = attendanceRepository.sumPointsByUserIdAndDateRange(userId, LocalDate.of(2020, 1, 1), LocalDate.now());

        return AttendanceDto.AttendanceStatsResponse.builder()
                .totalAttendanceDays(totalAttendanceDays)
                .currentMonthPoints(currentMonthPoints)
                .consecutiveDays(consecutiveDays)
                .totalPoints(totalPoints)
                .build();
    }

    /**
     * 연속 출석 일수 계산
     * 오늘 출석했다면 오늘 포함, 안 했다면 어제까지의 연속 출석일수 반환
     */
    private int calculateConsecutiveDays(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate checkDate = today.minusDays(1); // 어제부터 시작
        int consecutiveDays = 0;

        // 어제부터 역순으로 연속 출석일수 계산
        while (attendanceRepository.findByUserIdAndAttendanceDate(userId, checkDate).isPresent()) {
            consecutiveDays++;
            checkDate = checkDate.minusDays(1);
        }

        // 오늘 출석했다면 +1
        if (attendanceRepository.findByUserIdAndAttendanceDate(userId, today).isPresent()) {
            consecutiveDays++;
        }

        return consecutiveDays;
    }
} 
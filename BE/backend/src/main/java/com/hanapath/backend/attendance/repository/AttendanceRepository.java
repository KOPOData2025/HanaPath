package com.hanapath.backend.attendance.repository;

import com.hanapath.backend.attendance.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    // 특정 사용자의 특정 날짜 출석 여부 확인
    Optional<Attendance> findByUserIdAndAttendanceDate(Long userId, LocalDate date);

    // 특정 사용자의 특정 월 출석 기록 조회
    @Query("SELECT a FROM Attendance a WHERE a.userId = :userId " +
           "AND YEAR(a.attendanceDate) = :year AND MONTH(a.attendanceDate) = :month " +
           "ORDER BY a.attendanceDate")
    List<Attendance> findByUserIdAndYearAndMonth(@Param("userId") Long userId, 
                                                @Param("year") int year, 
                                                @Param("month") int month);

    // 특정 사용자의 연속 출석 일수 조회
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.userId = :userId " +
           "AND a.attendanceDate >= :startDate " +
           "AND a.attendanceDate <= :endDate " +
           "ORDER BY a.attendanceDate")
    Long countConsecutiveDays(@Param("userId") Long userId, 
                             @Param("startDate") LocalDate startDate, 
                             @Param("endDate") LocalDate endDate);

    // 특정 사용자의 총 출석 일수 조회
    Long countByUserId(Long userId);

    // 특정 사용자의 특정 기간 총 포인트 조회
    @Query("SELECT COALESCE(SUM(a.pointsEarned), 0) FROM Attendance a " +
           "WHERE a.userId = :userId " +
           "AND a.attendanceDate >= :startDate " +
           "AND a.attendanceDate <= :endDate")
    Integer sumPointsByUserIdAndDateRange(@Param("userId") Long userId, 
                                         @Param("startDate") LocalDate startDate, 
                                         @Param("endDate") LocalDate endDate);
} 
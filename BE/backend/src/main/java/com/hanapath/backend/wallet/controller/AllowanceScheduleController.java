package com.hanapath.backend.wallet.controller;

import com.hanapath.backend.wallet.dto.AllowanceScheduleDto;
import com.hanapath.backend.wallet.service.AllowanceScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/allowance-schedules")
@RequiredArgsConstructor
public class AllowanceScheduleController {

    private final AllowanceScheduleService allowanceScheduleService;

    /**
     * 용돈 스케줄 생성
     */
    @PostMapping
    public ResponseEntity<AllowanceScheduleDto.ResponseDto> createAllowanceSchedule(
            @RequestBody AllowanceScheduleDto.CreateRequestDto requestDto) {
        try {
            // 현재 인증된 사용자 정보 가져오기
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userIdStr = authentication.getName(); 
            Long currentUserId = Long.parseLong(userIdStr);
            
            System.out.println("=== 용돈 스케줄 생성 요청 ===");
            System.out.println("인증된 사용자 ID: " + currentUserId);
            System.out.println("요청 데이터: " + requestDto);
            
            // 요청의 parentId를 현재 인증된 사용자 ID로 설정
            requestDto.setParentId(currentUserId);
            
            AllowanceScheduleDto.ResponseDto response = allowanceScheduleService.createAllowanceSchedule(requestDto);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("용돈 스케줄 생성 중 오류: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * 부모의 모든 용돈 스케줄 조회
     */
    @GetMapping("/parent")
    public ResponseEntity<List<AllowanceScheduleDto.ResponseDto>> getParentSchedules() {
        // 현재 인증된 사용자 정보 가져오기
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userIdStr = authentication.getName(); 
        Long currentUserId = Long.parseLong(userIdStr);
        
        List<AllowanceScheduleDto.ResponseDto> schedules = allowanceScheduleService.getParentSchedules(currentUserId);
        return ResponseEntity.ok(schedules);
    }

    /**
     * 자식의 모든 용돈 스케줄 조회
     */
    @GetMapping("/child/{childId}")
    public ResponseEntity<List<AllowanceScheduleDto.ResponseDto>> getChildSchedules(@PathVariable Long childId) {
        List<AllowanceScheduleDto.ResponseDto> schedules = allowanceScheduleService.getChildSchedules(childId);
        return ResponseEntity.ok(schedules);
    }

    /**
     * 용돈 스케줄 상태 업데이트
     */
    @PutMapping("/status")
    public ResponseEntity<AllowanceScheduleDto.ResponseDto> updateScheduleStatus(
            @RequestBody AllowanceScheduleDto.UpdateStatusDto requestDto) {
        AllowanceScheduleDto.ResponseDto response = allowanceScheduleService.updateScheduleStatus(requestDto);
        return ResponseEntity.ok(response);
    }

    /**
     * 용돈 스케줄 삭제 (취소)
     */
    @DeleteMapping("/{scheduleId}")
    public ResponseEntity<Void> deleteSchedule(
            @PathVariable Long scheduleId,
            @RequestParam Long userId) {
        allowanceScheduleService.deleteSchedule(scheduleId, userId);
        return ResponseEntity.ok().build();
    }
} 
package com.hanapath.backend.notification.controller;

import com.hanapath.backend.notification.dto.NotificationDto;
import com.hanapath.backend.notification.entity.Notification;
import com.hanapath.backend.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = {"${app.urls.frontend}", "${app.urls.frontend-alt}"})
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * 사용자별 알림 조회
     */
    @GetMapping("/{userId}")
    public ResponseEntity<List<NotificationDto.ResponseDto>> getNotifications(@PathVariable Long userId) {
        try {
            List<NotificationDto.ResponseDto> notifications = notificationService.getNotificationsByUserId(userId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * 사용자별 미읽은 알림 조회
     */
    @GetMapping("/{userId}/unread")
    public ResponseEntity<List<NotificationDto.ResponseDto>> getUnreadNotifications(@PathVariable Long userId) {
        try {
            List<NotificationDto.ResponseDto> notifications = notificationService.getUnreadNotificationsByUserId(userId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * 사용자별 카테고리별 알림 조회
     */
    @GetMapping("/{userId}/category/{category}")
    public ResponseEntity<List<NotificationDto.ResponseDto>> getNotificationsByCategory(
            @PathVariable Long userId, 
            @PathVariable String category) {
        try {
            String categoryUpper = category.equals("other") ? "OTHER" : category.toUpperCase();
            Notification.NotificationCategory notificationCategory = 
                    Notification.NotificationCategory.valueOf(categoryUpper);
            List<NotificationDto.ResponseDto> notifications = 
                    notificationService.getNotificationsByUserIdAndCategory(userId, notificationCategory);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * 알림 읽음 처리
     */
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Map<String, String>> markAsRead(
            @PathVariable Long notificationId,
            @RequestParam Long userId) {
        try {
            notificationService.markAsRead(notificationId, userId);
            return ResponseEntity.ok(Map.of("message", "알림을 읽음으로 처리했습니다."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 모든 알림 읽음 처리
     */
    @PutMapping("/{userId}/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(@PathVariable Long userId) {
        try {
            notificationService.markAllAsRead(userId);
            return ResponseEntity.ok(Map.of("message", "모든 알림을 읽음으로 처리했습니다."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 미읽은 알림 개수 조회
     */
    @GetMapping("/{userId}/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@PathVariable Long userId) {
        try {
            Long count = notificationService.getUnreadCount(userId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("count", 0L));
        }
    }
}

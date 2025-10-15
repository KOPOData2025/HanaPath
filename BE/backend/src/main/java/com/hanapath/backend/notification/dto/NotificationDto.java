package com.hanapath.backend.notification.dto;

import com.hanapath.backend.notification.entity.Notification;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@Builder
public class NotificationDto {

    @Getter
    @Setter
    @AllArgsConstructor
    @Builder
    public static class ResponseDto {
        private Long id;
        private String title;
        private String description;
        private String type;
        private String category;
        private Boolean isRead;
        private LocalDateTime createdAt;
        private String timeAgo;
        private String relatedData;

        public static ResponseDto fromEntity(Notification notification) {
            return ResponseDto.builder()
                    .id(notification.getId())
                    .title(notification.getTitle())
                    .description(notification.getDescription())
                    .type(notification.getType().name().toLowerCase())
                    .category(notification.getCategory().name().toLowerCase())
                    .isRead(notification.getIsRead())
                    .createdAt(notification.getCreatedAt())
                    .timeAgo(calculateTimeAgo(notification.getCreatedAt()))
                    .relatedData(notification.getRelatedData())
                    .build();
        }

        private static String calculateTimeAgo(LocalDateTime createdAt) {
            LocalDateTime now = LocalDateTime.now();
            long minutes = java.time.Duration.between(createdAt, now).toMinutes();
            
            if (minutes < 1) {
                return "방금 전";
            } else if (minutes < 60) {
                return minutes + "분 전";
            } else if (minutes < 1440) { 
                long hours = minutes / 60;
                return hours + "시간 전";
            } else {
                long days = minutes / 1440;
                return days + "일 전";
            }
        }
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @Builder
    public static class CreateDto {
        private Long userId;
        private String title;
        private String description;
        private Notification.NotificationType type;
        private Notification.NotificationCategory category;
        private String relatedData;
    }
}

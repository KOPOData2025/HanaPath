package com.hanapath.backend.notification.service;

import com.hanapath.backend.notification.dto.NotificationDto;
import com.hanapath.backend.notification.entity.Notification;
import com.hanapath.backend.notification.repository.NotificationRepository;
import com.hanapath.backend.users.entity.User;
import com.hanapath.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * 알림 생성
     */
    @Transactional
    public NotificationDto.ResponseDto createNotification(NotificationDto.CreateDto createDto) {
        User user = userRepository.findById(createDto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Notification notification = Notification.builder()
                .user(user)
                .title(createDto.getTitle())
                .description(createDto.getDescription())
                .type(createDto.getType())
                .category(createDto.getCategory())
                .relatedData(createDto.getRelatedData())
                .isRead(false)
                .build();

        Notification savedNotification = notificationRepository.save(notification);
        log.info("알림 생성 완료 - 사용자: {}, 제목: {}", user.getName(), createDto.getTitle());
        
        return NotificationDto.ResponseDto.fromEntity(savedNotification);
    }

    /**
     * 전화번호 포맷팅 유틸리티
     */
    private String formatPhoneNumber(String phone) {
        if (phone == null || phone.isEmpty()) {
            return "전화번호 없음";
        }
        String cleanPhone = phone.replaceAll("[^\\d]", "");
        if (cleanPhone.length() == 11) {
            return String.format("%s-%s-%s", 
                cleanPhone.substring(0, 3), 
                cleanPhone.substring(3, 7), 
                cleanPhone.substring(7));
        }
        return phone;
    }

    /**
     * 관계 요청 알림 생성
     */
    @Transactional
    public void createRelationshipRequestNotification(Long receiverId, String requesterName, String requesterPhone, String relationshipType, Long relationshipId) {
        String title = "새로운 관계 요청이 도착했습니다";
        String formattedPhone = formatPhoneNumber(requesterPhone);
        String description = String.format("%s(%s)님이\n%s 관계를 요청했습니다.", requesterName, formattedPhone, relationshipType);
        
        // 관계 ID를 JSON 형태로 저장
        String relatedData = String.format("{\"relationshipId\": %d}", relationshipId);
        
        NotificationDto.CreateDto createDto = NotificationDto.CreateDto.builder()
                .userId(receiverId)
                .title(title)
                .description(description)
                .type(Notification.NotificationType.RELATIONSHIP_REQUEST)
                .category(Notification.NotificationCategory.RELATIONSHIP)
                .relatedData(relatedData)
                .build();

        createNotification(createDto);
    }

    /**
     * 관계 승인 알림 생성
     */
    @Transactional
    public void createRelationshipApprovedNotification(Long requesterId, String receiverName, String receiverPhone, String relationshipType) {
        String title = "관계 요청이 승인되었습니다";
        String formattedPhone = formatPhoneNumber(receiverPhone);
        String description = String.format("%s(%s)님이\n%s 관계 요청을 승인했습니다.", receiverName, formattedPhone, relationshipType);
        
        NotificationDto.CreateDto createDto = NotificationDto.CreateDto.builder()
                .userId(requesterId)
                .title(title)
                .description(description)
                .type(Notification.NotificationType.RELATIONSHIP_APPROVED)
                .category(Notification.NotificationCategory.RELATIONSHIP)
                .build();

        createNotification(createDto);
    }

    /**
     * 관계 거절 알림 생성
     */
    @Transactional
    public void createRelationshipRejectedNotification(Long requesterId, String receiverName, String receiverPhone, String relationshipType) {
        String title = "관계 요청이 거절되었습니다";
        String formattedPhone = formatPhoneNumber(receiverPhone);
        String description = String.format("%s(%s)님이 %s 관계 요청을 거절했습니다.", receiverName, formattedPhone, relationshipType);
        
        NotificationDto.CreateDto createDto = NotificationDto.CreateDto.builder()
                .userId(requesterId)
                .title(title)
                .description(description)
                .type(Notification.NotificationType.RELATIONSHIP_REJECTED)
                .category(Notification.NotificationCategory.RELATIONSHIP)
                .build();

        createNotification(createDto);
    }

    /**
     * 사용자별 알림 조회
     */
    public List<NotificationDto.ResponseDto> getNotificationsByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        return notifications.stream()
                .map(NotificationDto.ResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 사용자별 미읽은 알림 조회
     */
    public List<NotificationDto.ResponseDto> getUnreadNotificationsByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        List<Notification> notifications = notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user);
        return notifications.stream()
                .map(NotificationDto.ResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 사용자별 카테고리별 알림 조회
     */
    public List<NotificationDto.ResponseDto> getNotificationsByUserIdAndCategory(Long userId, Notification.NotificationCategory category) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        List<Notification> notifications = notificationRepository.findByUserAndCategoryOrderByCreatedAtDesc(user, category);
        return notifications.stream()
                .map(NotificationDto.ResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 알림 읽음 처리
     */
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));

        if (!notification.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    /**
     * 모든 알림 읽음 처리
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        notificationRepository.markAllAsReadByUser(user);
        log.info("모든 알림 읽음 처리 완료 - 사용자: {}", user.getName());
    }

    /**
     * 미읽은 알림 개수 조회
     */
    public Long getUnreadCount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        return notificationRepository.countUnreadByUser(user);
    }
}

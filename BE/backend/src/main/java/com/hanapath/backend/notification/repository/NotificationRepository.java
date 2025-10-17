package com.hanapath.backend.notification.repository;

import com.hanapath.backend.notification.entity.Notification;
import com.hanapath.backend.users.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // 사용자별 알림 조회 (최신순)
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    
    // 사용자별 미읽은 알림 조회
    List<Notification> findByUserAndIsReadFalseOrderByCreatedAtDesc(User user);
    
    // 사용자별 카테고리별 알림 조회
    List<Notification> findByUserAndCategoryOrderByCreatedAtDesc(User user, Notification.NotificationCategory category);
    
    // 사용자별 미읽은 알림 개수
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user = :user AND n.isRead = false")
    Long countUnreadByUser(@Param("user") User user);
    
    // 사용자별 모든 알림을 읽음으로 처리
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user = :user")
    void markAllAsReadByUser(@Param("user") User user);
}

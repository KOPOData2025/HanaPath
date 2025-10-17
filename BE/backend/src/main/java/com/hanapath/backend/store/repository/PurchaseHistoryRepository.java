package com.hanapath.backend.store.repository;

import com.hanapath.backend.store.entity.PurchaseHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PurchaseHistoryRepository extends JpaRepository<PurchaseHistory, Long> {

    /**
     * 사용자의 구매 내역 조회
     */
    List<PurchaseHistory> findByUserIdOrderByPurchaseDateDesc(Long userId);

    /**
     * 사용자의 사용 가능한 기프티콘 조회 (만료되지 않은 것들)
     */
    @Query("SELECT ph FROM PurchaseHistory ph WHERE ph.userId = :userId AND ph.expiryDate > :now AND ph.status = 'PURCHASED' ORDER BY ph.expiryDate ASC")
    List<PurchaseHistory> findValidGifticonsByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    /**
     * 사용자의 만료된 기프티콘 조회
     */
    @Query("SELECT ph FROM PurchaseHistory ph WHERE ph.userId = :userId AND ph.expiryDate <= :now ORDER BY ph.expiryDate DESC")
    List<PurchaseHistory> findExpiredGifticonsByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    /**
     * 사용자의 사용된 기프티콘 조회
     */
    List<PurchaseHistory> findByUserIdAndStatusOrderByPurchaseDateDesc(Long userId, PurchaseHistory.PurchaseStatus status);
} 
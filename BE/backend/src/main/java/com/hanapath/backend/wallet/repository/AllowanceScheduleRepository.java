package com.hanapath.backend.wallet.repository;

import com.hanapath.backend.wallet.entity.AllowanceSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AllowanceScheduleRepository extends JpaRepository<AllowanceSchedule, Long> {

    /**
     * 부모 ID로 모든 용돈 스케줄 조회
     */
    List<AllowanceSchedule> findByParentIdAndStatus(Long parentId, AllowanceSchedule.ScheduleStatus status);

    /**
     * 자식 ID로 모든 용돈 스케줄 조회
     */
    List<AllowanceSchedule> findByChildIdAndStatus(Long childId, AllowanceSchedule.ScheduleStatus status);

    /**
     * 부모와 자식 관계로 용돈 스케줄 조회
     */
    Optional<AllowanceSchedule> findByParentIdAndChildIdAndStatus(
        Long parentId, 
        Long childId, 
        AllowanceSchedule.ScheduleStatus status
    );

    /**
     * 지급 예정인 모든 활성 스케줄 조회
     */
    @Query("SELECT a FROM AllowanceSchedule a WHERE a.status = 'ACTIVE' AND a.nextPaymentDate <= :now")
    List<AllowanceSchedule> findDueSchedules(@Param("now") LocalDateTime now);

    /**
     * 특정 부모의 지급 예정 스케줄 조회
     */
    @Query("SELECT a FROM AllowanceSchedule a WHERE a.parent.id = :parentId AND a.status = 'ACTIVE' AND a.nextPaymentDate <= :now")
    List<AllowanceSchedule> findDueSchedulesByParent(@Param("parentId") Long parentId, @Param("now") LocalDateTime now);

    /**
     * 특정 자녀의 지급 예정 스케줄 조회
     */
    @Query("SELECT a FROM AllowanceSchedule a WHERE a.child.id = :childId AND a.status = 'ACTIVE' AND a.nextPaymentDate <= :now")
    List<AllowanceSchedule> findDueSchedulesByChild(@Param("childId") Long childId, @Param("now") LocalDateTime now);
} 
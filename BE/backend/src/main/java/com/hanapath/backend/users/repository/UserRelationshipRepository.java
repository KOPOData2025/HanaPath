package com.hanapath.backend.users.repository;

import com.hanapath.backend.users.entity.UserRelationship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRelationshipRepository extends JpaRepository<UserRelationship, Long> {

    // 사용자가 요청자이거나 수신자인 모든 관계 조회
    @Query("SELECT ur FROM UserRelationship ur WHERE ur.requester.id = :userId OR ur.receiver.id = :userId")
    List<UserRelationship> findAllByUserId(@Param("userId") Long userId);

    // 사용자가 받은 요청들 조회 (PENDING 상태)
    @Query("SELECT ur FROM UserRelationship ur WHERE ur.receiver.id = :userId AND ur.status = 'PENDING'")
    List<UserRelationship> findPendingRequestsByReceiverId(@Param("userId") Long userId);

    // 사용자가 보낸 요청들 조회
    @Query("SELECT ur FROM UserRelationship ur WHERE ur.requester.id = :userId")
    List<UserRelationship> findRequestsByRequesterId(@Param("userId") Long userId);

    // 두 사용자 간의 관계가 이미 존재하는지 확인
    @Query("SELECT ur FROM UserRelationship ur WHERE " +
           "(ur.requester.id = :userId1 AND ur.receiver.id = :userId2) OR " +
           "(ur.requester.id = :userId2 AND ur.receiver.id = :userId1)")
    Optional<UserRelationship> findRelationshipBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    // 특정 상태의 관계들 조회
    @Query("SELECT ur FROM UserRelationship ur WHERE " +
           "(ur.requester.id = :userId OR ur.receiver.id = :userId) AND ur.status = :status")
    List<UserRelationship> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") UserRelationship.RelationshipStatus status);
} 
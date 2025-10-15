package com.hanapath.backend.wallet.repository;

import com.hanapath.backend.wallet.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {

    // 사용자 ID로 지갑 조회
    Optional<Wallet> findByUserId(Long userId);

    // 계좌번호로 지갑 조회
    Optional<Wallet> findByAccountNumber(String accountNumber);

    // 사용자가 지갑을 소유하고 있는지 확인
    boolean existsByUserId(Long userId);

    // 계좌번호 중복 확인
    boolean existsByAccountNumber(String accountNumber);

    // 활성 상태인 지갑 조회
    @Query("SELECT w FROM Wallet w WHERE w.user.id = :userId AND w.status = 'ACTIVE'")
    Optional<Wallet> findActiveWalletByUserId(@Param("userId") Long userId);
}
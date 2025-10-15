package com.hanapath.backend.account.repository;

import com.hanapath.backend.account.entity.InvestmentAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvestmentAccountRepository extends JpaRepository<InvestmentAccount, Long> {

    // 사용자 ID로 투자 계좌 조회
    Optional<InvestmentAccount> findByUserId(Long userId);

    // 계좌번호로 투자 계좌 조회
    Optional<InvestmentAccount> findByAccountNumber(String accountNumber);

    // 사용자가 투자 계좌를 소유하고 있는지 확인
    boolean existsByUserId(Long userId);

    // 계좌번호 중복 확인
    boolean existsByAccountNumber(String accountNumber);

    // 활성 상태인 투자 계좌 조회
    @Query("SELECT ia FROM InvestmentAccount ia WHERE ia.user.id = :userId AND ia.status = 'ACTIVE'")
    Optional<InvestmentAccount> findActiveAccountByUserId(@Param("userId") Long userId);
}
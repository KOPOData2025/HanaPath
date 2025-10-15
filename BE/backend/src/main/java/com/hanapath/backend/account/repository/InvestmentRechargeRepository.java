package com.hanapath.backend.account.repository;

import com.hanapath.backend.account.entity.InvestmentRecharge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface InvestmentRechargeRepository extends JpaRepository<InvestmentRecharge, Long> {

    Optional<InvestmentRecharge> findByUserIdAndRechargeDate(Long userId, LocalDate rechargeDate);

    boolean existsByUserIdAndRechargeDate(Long userId, LocalDate rechargeDate);
}



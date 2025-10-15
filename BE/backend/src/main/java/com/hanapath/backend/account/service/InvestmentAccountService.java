package com.hanapath.backend.account.service;

import com.hanapath.backend.account.dto.InvestmentAccountDto;
import com.hanapath.backend.account.entity.InvestmentAccount;
import com.hanapath.backend.account.entity.InvestmentRecharge;
import com.hanapath.backend.account.repository.InvestmentAccountRepository;
import com.hanapath.backend.account.repository.InvestmentRechargeRepository;
import com.hanapath.backend.users.entity.User;
import com.hanapath.backend.users.entity.UserRelationship;
import com.hanapath.backend.users.entity.UserType;
import com.hanapath.backend.users.repository.UserRepository;
import com.hanapath.backend.users.repository.UserRelationshipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class InvestmentAccountService {

    private final InvestmentAccountRepository accountRepository;
    private final InvestmentRechargeRepository rechargeRepository;
    private final UserRepository userRepository;
    private final UserRelationshipRepository relationshipRepository;
    private final PasswordEncoder passwordEncoder;

    // 투자 계좌 생성
    @Transactional
    public InvestmentAccountDto.ResponseDto createAccount(Long userId, InvestmentAccountDto.CreateRequestDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        // 이미 투자 계좌가 있는지 확인
        if (accountRepository.existsByUserId(userId)) {
            throw new IllegalArgumentException("이미 모의 투자 계좌가 존재합니다.");
        }

        // TEEN 사용자인 경우 부모 관계 확인
        if (user.getUserType() == UserType.TEEN) {
            validateParentRelationship(userId);
        }

        // 약관 동의 확인
        if (!dto.isTermsAgreed()) {
            throw new IllegalArgumentException("약관에 동의해야 합니다.");
        }

        // 계좌번호 생성
        String accountNumber = generateInvestmentAccountNumber();

        // 투자 계좌 생성
        InvestmentAccount account = InvestmentAccount.builder()
                .user(user)
                .accountNumber(accountNumber)
                .accountPassword(passwordEncoder.encode(dto.getAccountPassword()))
                .build();

        InvestmentAccount savedAccount = accountRepository.save(account);
        return InvestmentAccountDto.ResponseDto.fromEntity(savedAccount);
    }

    // 투자 계좌 조회
    public InvestmentAccountDto.ResponseDto getAccount(Long userId) {
        InvestmentAccount account = accountRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("모의 투자 계좌가 존재하지 않습니다."));

        return InvestmentAccountDto.ResponseDto.fromEntity(account);
    }

    // 투자 계좌 잔액 조회
    public InvestmentAccountDto.BalanceDto getBalance(Long userId) {
        InvestmentAccount account = accountRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("모의 투자 계좌가 존재하지 않습니다."));

        return InvestmentAccountDto.BalanceDto.builder()
                .balance(account.getBalance())
                .totalProfitLoss(account.getTotalProfitLoss())
                .accountNumber(account.getAccountNumber())
                .status(account.getStatus().toString())
                .build();
    }

    // 모의 투자 계좌 레벨 기반 재충전 (하루 1회)
    @Transactional
    public InvestmentAccountDto.BalanceDto recharge(Long userId) {
        InvestmentAccount account = accountRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("모의 투자 계좌가 존재하지 않습니다."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        // 잔액이 0원일 때만 재충전 허용
        if (account.getBalance() == null || account.getBalance().compareTo(BigDecimal.ZERO) != 0) {
            throw new IllegalStateException("잔액이 0원일 때만 재충전할 수 있습니다.");
        }

        // 하루 1회 제한
        LocalDate today = LocalDate.now();
        if (rechargeRepository.existsByUserIdAndRechargeDate(userId, today)) {
            throw new IllegalStateException("오늘 이미 재충전을 진행했습니다. 내일 다시 시도해주세요.");
        }

        // 레벨별 재충전 한도
        int level = user.getLevel() != null ? user.getLevel() : 1;
        BigDecimal rechargeAmount;
        switch (level) {
            case 2 -> rechargeAmount = BigDecimal.valueOf(50_000);
            case 3 -> rechargeAmount = BigDecimal.valueOf(100_000);
            case 4 -> rechargeAmount = BigDecimal.valueOf(300_000);
            case 5 -> rechargeAmount = BigDecimal.valueOf(500_000);
            default -> throw new IllegalStateException("레벨 2 이상부터 재충전이 가능합니다.");
        }

        // 잔액 충전
        account.setBalance(account.getBalance().add(rechargeAmount));
        accountRepository.save(account);

        // 이력 저장
        InvestmentRecharge history = InvestmentRecharge.builder()
                .userId(userId)
                .rechargeDate(today)
                .amount(rechargeAmount)
                .levelAtRecharge(level)
                .createdAt(LocalDateTime.now())
                .build();
        rechargeRepository.save(history);

        return InvestmentAccountDto.BalanceDto.builder()
                .balance(account.getBalance())
                .totalProfitLoss(account.getTotalProfitLoss())
                .accountNumber(account.getAccountNumber())
                .status(account.getStatus().toString())
                .build();
    }

    // 투자 계좌 소유 여부 확인
    public boolean hasAccount(Long userId) {
        return accountRepository.existsByUserId(userId);
    }

    // TEEN 사용자의 부모 관계 검증
    private void validateParentRelationship(Long userId) {
        List<UserRelationship> relationships = relationshipRepository.findByUserIdAndStatus(
                userId, UserRelationship.RelationshipStatus.ACCEPTED);

        boolean hasParentRelation = relationships.stream()
                .anyMatch(rel -> rel.getType() == UserRelationship.RelationshipType.PARENT_CHILD &&
                        ((rel.getRequester().getId().equals(userId) && rel.getReceiver().getUserType() == UserType.PARENT) ||
                         (rel.getReceiver().getId().equals(userId) && rel.getRequester().getUserType() == UserType.PARENT)));

        if (!hasParentRelation) {
            throw new IllegalArgumentException("청소년 사용자는 부모와의 관계가 승인된 후 모의 투자 계좌를 생성할 수 있습니다.");
        }
    }

    // 투자 계좌번호 생성 (8자리 + 010 = 11자리 숫자)
    private String generateInvestmentAccountNumber() {
        Random random = new Random();
        String accountNumber;
        
        do {
            StringBuilder sb = new StringBuilder();
            
            // 8자리 랜덤 숫자
            for (int i = 0; i < 8; i++) {
                sb.append(random.nextInt(10));
            }
            
            sb.append("010");
            
            accountNumber = sb.toString();
        } while (accountRepository.existsByAccountNumber(accountNumber));
        
        return accountNumber;
    }
}
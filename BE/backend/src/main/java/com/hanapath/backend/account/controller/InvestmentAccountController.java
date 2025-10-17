package com.hanapath.backend.account.controller;

import com.hanapath.backend.account.dto.InvestmentAccountDto;
import com.hanapath.backend.account.service.InvestmentAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/investment-account")
@RequiredArgsConstructor
public class InvestmentAccountController {

    private final InvestmentAccountService accountService;

    // 모의 투자 계좌 생성
    @PostMapping("/{userId}/create")
    public ResponseEntity<InvestmentAccountDto.ResponseDto> createAccount(
            @PathVariable Long userId,
            @RequestBody @Valid InvestmentAccountDto.CreateRequestDto dto) {
        InvestmentAccountDto.ResponseDto account = accountService.createAccount(userId, dto);
        return ResponseEntity.ok(account);
    }

    // 모의 투자 계좌 조회
    @GetMapping("/{userId}")
    public ResponseEntity<InvestmentAccountDto.ResponseDto> getAccount(@PathVariable Long userId) {
        InvestmentAccountDto.ResponseDto account = accountService.getAccount(userId);
        return ResponseEntity.ok(account);
    }

    // 투자 계좌 잔액 조회
    @GetMapping("/{userId}/balance")
    public ResponseEntity<InvestmentAccountDto.BalanceDto> getBalance(@PathVariable Long userId) {
        InvestmentAccountDto.BalanceDto balance = accountService.getBalance(userId);
        return ResponseEntity.ok(balance);
    }

    // 투자 계좌 소유 여부 확인
    @GetMapping("/{userId}/exists")
    public ResponseEntity<Boolean> hasAccount(@PathVariable Long userId) {
        boolean exists = accountService.hasAccount(userId);
        return ResponseEntity.ok(exists);
    }

    // 모의 투자 계좌 재충전 (하루 1회, 레벨 기반 한도)
    @PostMapping("/{userId}/recharge")
    public ResponseEntity<InvestmentAccountDto.BalanceDto> recharge(@PathVariable Long userId) {
        return ResponseEntity.ok(accountService.recharge(userId));
    }
}
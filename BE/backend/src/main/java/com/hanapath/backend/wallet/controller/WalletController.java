package com.hanapath.backend.wallet.controller;

import com.hanapath.backend.wallet.dto.WalletDto;
import com.hanapath.backend.wallet.dto.WalletTransactionDto;
import com.hanapath.backend.wallet.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    // 디지털 지갑 생성
    @PostMapping("/{userId}/create")
    public ResponseEntity<WalletDto.ResponseDto> createWallet(
            @PathVariable Long userId,
            @RequestBody @Valid WalletDto.CreateRequestDto dto) {
        WalletDto.ResponseDto wallet = walletService.createWallet(userId, dto);
        return ResponseEntity.ok(wallet);
    }

    // 디지털 지갑 조회
    @GetMapping("/{userId}")
    public ResponseEntity<WalletDto.ResponseDto> getWallet(@PathVariable Long userId) {
        WalletDto.ResponseDto wallet = walletService.getWallet(userId);
        return ResponseEntity.ok(wallet);
    }

    // 지갑 잔액 조회
    @GetMapping("/{userId}/balance")
    public ResponseEntity<WalletDto.BalanceDto> getBalance(@PathVariable Long userId) {
        WalletDto.BalanceDto balance = walletService.getBalance(userId);
        return ResponseEntity.ok(balance);
    }

    // 지갑 소유 여부 확인
    @GetMapping("/{userId}/exists")
    public ResponseEntity<Boolean> hasWallet(@PathVariable Long userId) {
        boolean exists = walletService.hasWallet(userId);
        return ResponseEntity.ok(exists);
    }

    // 송금 실행
    @PostMapping("/transfer")
    public ResponseEntity<WalletDto.TransferResponseDto> transfer(
            @RequestBody @Valid WalletDto.TransferRequestDto dto) {
        WalletDto.TransferResponseDto result = walletService.transfer(dto);
        return ResponseEntity.ok(result);
    }

    // 비밀번호 검증
    @PostMapping("/validate-password")
    public ResponseEntity<Boolean> validatePassword(
            @RequestBody @Valid WalletDto.PasswordValidationDto dto) {
        boolean isValid = walletService.validatePassword(dto);
        return ResponseEntity.ok(isValid);
    }

    // 거래 내역 메모 업데이트
    @PutMapping("/transactions/{transactionId}/memo")
    public ResponseEntity<WalletTransactionDto.ResponseDto> updateTransactionMemo(
            @PathVariable Long transactionId,
            @RequestBody @Valid WalletTransactionDto.MemoUpdateDto dto) {
        WalletTransactionDto.ResponseDto updatedTransaction = walletService.updateTransactionMemo(transactionId, dto);
        return ResponseEntity.ok(updatedTransaction);
    }
}
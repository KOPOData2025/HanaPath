package com.hanapath.backend.wallet.controller;

import com.hanapath.backend.wallet.dto.WalletTransactionDto;
import com.hanapath.backend.wallet.service.WalletTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wallet/transactions")
@RequiredArgsConstructor
public class WalletTransactionController {

    private final WalletTransactionService transactionService;

    // 거래 내역 조회 (페이징)
    @GetMapping
    public ResponseEntity<WalletTransactionDto.PageResponseDto> getTransactions(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String searchQuery) {
        
        System.out.println("=== 거래 내역 조회 요청 ===");
        System.out.println("Username: " + userDetails.getUsername());
        
        Long userId = Long.parseLong(userDetails.getUsername());
        System.out.println("Parsed User ID: " + userId);
        System.out.println("Page: " + page + ", Size: " + size);
        
        WalletTransactionDto.PageResponseDto response = transactionService.getTransactions(userId, page, size, category, type, searchQuery);
        return ResponseEntity.ok(response);
    }

    // 거래 내역 요약 조회
    @GetMapping("/summary")
    public ResponseEntity<WalletTransactionDto.SummaryDto> getTransactionSummary(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = Long.parseLong(userDetails.getUsername());
        WalletTransactionDto.SummaryDto response = transactionService.getTransactionSummary(userId);
        return ResponseEntity.ok(response);
    }

    // 거래 내역 생성
    @PostMapping
    public ResponseEntity<WalletTransactionDto.ResponseDto> createTransaction(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody WalletTransactionDto.CreateRequestDto requestDto) {
        
        Long userId = Long.parseLong(userDetails.getUsername());
        WalletTransactionDto.ResponseDto response = transactionService.createTransaction(userId, requestDto);
        return ResponseEntity.ok(response);
    }
} 
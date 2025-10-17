package com.hanapath.backend.investment.controller;

import com.hanapath.backend.investment.dto.InvestmentTradingDto;
import com.hanapath.backend.investment.service.InvestmentTradingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/investment")
@RequiredArgsConstructor
public class InvestmentTradingController {

    private final InvestmentTradingService tradingService;

    @PostMapping("/{userId}/buy")
    public ResponseEntity<InvestmentTradingDto.OrderResponse> buy(@PathVariable Long userId,
                                                                  @RequestBody InvestmentTradingDto.OrderRequest request) {
        return ResponseEntity.ok(tradingService.buy(userId, request));
    }

    @PostMapping("/{userId}/sell")
    public ResponseEntity<InvestmentTradingDto.OrderResponse> sell(@PathVariable Long userId,
                                                                   @RequestBody InvestmentTradingDto.OrderRequest request) {
        return ResponseEntity.ok(tradingService.sell(userId, request));
    }

    @GetMapping("/{userId}/holdings")
    public ResponseEntity<List<InvestmentTradingDto.HoldingResponse>> getHoldings(@PathVariable Long userId) {
        return ResponseEntity.ok(tradingService.getHoldings(userId));
    }

    @GetMapping("/{userId}/transactions")
    public ResponseEntity<InvestmentTradingDto.PagedTransactionsResponse> getTransactions(@PathVariable Long userId,
                                                                                          @RequestParam(defaultValue = "0") int page,
                                                                                          @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(tradingService.getTransactions(userId, page, size));
    }

    @PostMapping("/{userId}/favorites")
    public ResponseEntity<Void> addFavorite(@PathVariable Long userId,
                                            @RequestParam String ticker,
                                            @RequestParam String name) {
        tradingService.addFavorite(userId, ticker, name);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{userId}/favorites")
    public ResponseEntity<Void> removeFavorite(@PathVariable Long userId,
                                               @RequestParam String ticker) {
        tradingService.removeFavorite(userId, ticker);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{userId}/favorites")
    public ResponseEntity<List<InvestmentTradingDto.FavoriteResponse>> getFavorites(@PathVariable Long userId) {
        return ResponseEntity.ok(tradingService.getFavorites(userId));
    }
}

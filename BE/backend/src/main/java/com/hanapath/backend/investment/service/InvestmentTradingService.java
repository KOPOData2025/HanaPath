package com.hanapath.backend.investment.service;

import com.hanapath.backend.account.entity.InvestmentAccount;
import com.hanapath.backend.account.repository.InvestmentAccountRepository;
import com.hanapath.backend.investment.dto.InvestmentTradingDto;
import com.hanapath.backend.investment.entity.StockFavorite;
import com.hanapath.backend.investment.entity.StockHolding;
import com.hanapath.backend.investment.entity.StockTransaction;
import com.hanapath.backend.investment.repository.StockFavoriteRepository;
import com.hanapath.backend.investment.repository.StockHoldingRepository;
import com.hanapath.backend.investment.repository.StockTransactionRepository;
import com.hanapath.backend.users.entity.User;
import com.hanapath.backend.users.repository.UserRepository;
import com.hanapath.backend.stock.entity.StockMaster;
import com.hanapath.backend.stock.repository.StockMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvestmentTradingService {

    private final UserRepository userRepository;
    private final InvestmentAccountRepository accountRepository;
    private final StockHoldingRepository holdingRepository;
    private final StockTransactionRepository transactionRepository;
    private final StockFavoriteRepository favoriteRepository;
    private final StockMasterRepository stockMasterRepository;
    private final PasswordEncoder passwordEncoder;

    private void ensureStockMaster(String ticker, String name) {
        stockMasterRepository.findByTicker(ticker).orElseGet(() ->
                stockMasterRepository.save(StockMaster.builder()
                        .ticker(ticker)
                        .name(name)
                        .build())
        );
    }

    @Transactional
    public InvestmentTradingDto.OrderResponse buy(Long userId, InvestmentTradingDto.OrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        InvestmentAccount account = accountRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("모의 투자 계좌가 존재하지 않습니다."));

        // 계좌 비밀번호 검증
        if (request.getAccountPassword() == null || request.getAccountPassword().length() == 0) {
            throw new IllegalArgumentException("계좌 비밀번호가 필요합니다.");
        }
        if (!passwordEncoder.matches(request.getAccountPassword(), account.getAccountPassword())) {
            throw new IllegalArgumentException("계좌 비밀번호가 일치하지 않습니다.");
        }

        ensureStockMaster(request.getTicker(), request.getName());

        BigDecimal totalAmount = request.getPrice().multiply(BigDecimal.valueOf(request.getQuantity()));
        if (account.getBalance().compareTo(totalAmount) < 0) {
            throw new IllegalArgumentException("잔액이 부족합니다.");
        }

        account.setBalance(account.getBalance().subtract(totalAmount));
        accountRepository.save(account);

        StockHolding holding = holdingRepository.findByUserIdAndTicker(userId, request.getTicker())
                .orElse(null);

        if (holding == null) {
            holding = StockHolding.builder()
                    .user(user)
                    .ticker(request.getTicker())
                    .name(request.getName())
                    .quantity(request.getQuantity())
                    .averagePrice(request.getPrice())
                    .build();
        } else {
            long newQuantity = holding.getQuantity() + request.getQuantity();
            BigDecimal currentTotal = holding.getAveragePrice().multiply(BigDecimal.valueOf(holding.getQuantity()));
            BigDecimal newTotal = currentTotal.add(totalAmount);
            BigDecimal newAvgPrice = newTotal.divide(BigDecimal.valueOf(newQuantity), 2, java.math.RoundingMode.HALF_UP);
            holding.setQuantity(newQuantity);
            holding.setAveragePrice(newAvgPrice);
        }
        holdingRepository.save(holding);

        StockTransaction tx = StockTransaction.builder()
                .user(user)
                .ticker(request.getTicker())
                .name(request.getName())
                .type(StockTransaction.TransactionType.BUY)
                .quantity(request.getQuantity())
                .pricePerShare(request.getPrice())
                .amount(totalAmount)
                .build();
        tx = transactionRepository.save(tx);

        return InvestmentTradingDto.OrderResponse.builder()
                .transactionId(tx.getId())
                .ticker(tx.getTicker())
                .name(tx.getName())
                .type(tx.getType().name())
                .quantity(tx.getQuantity())
                .pricePerShare(tx.getPricePerShare())
                .amount(tx.getAmount())
                .newBalance(account.getBalance())
                .createdAt(tx.getCreatedAt())
                .build();
    }

    @Transactional
    public InvestmentTradingDto.OrderResponse sell(Long userId, InvestmentTradingDto.OrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        InvestmentAccount account = accountRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("모의 투자 계좌가 존재하지 않습니다."));

        // 계좌 비밀번호 검증
        if (request.getAccountPassword() == null || request.getAccountPassword().length() == 0) {
            throw new IllegalArgumentException("계좌 비밀번호가 필요합니다.");
        }
        if (!passwordEncoder.matches(request.getAccountPassword(), account.getAccountPassword())) {
            throw new IllegalArgumentException("계좌 비밀번호가 일치하지 않습니다.");
        }

        StockHolding holding = holdingRepository.findByUserIdAndTicker(userId, request.getTicker())
                .orElseThrow(() -> new IllegalArgumentException("보유 수량이 없습니다."));

        ensureStockMaster(request.getTicker(), request.getName());

        if (holding.getQuantity() < request.getQuantity()) {
            throw new IllegalArgumentException("보유 수량이 부족합니다.");
        }

        BigDecimal totalAmount = request.getPrice().multiply(BigDecimal.valueOf(request.getQuantity()));
        BigDecimal netCredit = totalAmount;

        long remaining = holding.getQuantity() - request.getQuantity();
        if (remaining == 0) {
            holdingRepository.delete(holding);
        } else {
            holding.setQuantity(remaining);
            holdingRepository.save(holding);
        }

        account.setBalance(account.getBalance().add(netCredit));
        accountRepository.save(account);

        StockTransaction tx = StockTransaction.builder()
                .user(user)
                .ticker(request.getTicker())
                .name(request.getName())
                .type(StockTransaction.TransactionType.SELL)
                .quantity(request.getQuantity())
                .pricePerShare(request.getPrice())
                .amount(totalAmount)
                .build();
        tx = transactionRepository.save(tx);

        return InvestmentTradingDto.OrderResponse.builder()
                .transactionId(tx.getId())
                .ticker(tx.getTicker())
                .name(tx.getName())
                .type(tx.getType().name())
                .quantity(tx.getQuantity())
                .pricePerShare(tx.getPricePerShare())
                .amount(tx.getAmount())
                .newBalance(account.getBalance())
                .createdAt(tx.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<InvestmentTradingDto.HoldingResponse> getHoldings(Long userId) {
        return holdingRepository.findByUserId(userId).stream()
                .map(InvestmentTradingDto.HoldingResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InvestmentTradingDto.PagedTransactionsResponse getTransactions(Long userId, int page, int size) {
        var pageable = PageRequest.of(page, size);
        var all = transactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        var paged = transactionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return InvestmentTradingDto.PagedTransactionsResponse.builder()
                .transactions(paged.stream().map(InvestmentTradingDto.TransactionResponse::from).toList())
                .total(all.size())
                .build();
    }

    @Transactional
    public void addFavorite(Long userId, String ticker, String name) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
        if (favoriteRepository.existsByUserIdAndTicker(userId, ticker)) return;
        ensureStockMaster(ticker, name);
        favoriteRepository.save(StockFavorite.builder()
                .user(user)
                .ticker(ticker)
                .name(name)
                .build());
    }

    @Transactional
    public void removeFavorite(Long userId, String ticker) {
        favoriteRepository.findByUserIdAndTicker(userId, ticker)
                .ifPresent(favoriteRepository::delete);
    }

    @Transactional(readOnly = true)
    public List<InvestmentTradingDto.FavoriteResponse> getFavorites(Long userId) {
        return favoriteRepository.findByUserId(userId).stream()
                .map(InvestmentTradingDto.FavoriteResponse::from)
                .collect(Collectors.toList());
    }
}

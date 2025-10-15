package com.hanapath.backend.store.service;

import com.hanapath.backend.store.dto.ProductResponseDto;
import com.hanapath.backend.store.dto.PurchaseRequestDto;
import com.hanapath.backend.store.entity.Product;
import com.hanapath.backend.store.entity.PurchaseHistory;
import com.hanapath.backend.store.repository.ProductRepository;
import com.hanapath.backend.store.repository.PurchaseHistoryRepository;
import com.hanapath.backend.hanamoney.entity.HanaMoney;
import com.hanapath.backend.hanamoney.repository.HanaMoneyRepository;
import com.hanapath.backend.hanamoney.entity.HanaMoneyTransaction;
import com.hanapath.backend.hanamoney.repository.HanaMoneyTransactionRepository;
import com.hanapath.backend.users.entity.User;
import com.hanapath.backend.users.repository.UserRepository;
import com.hanapath.backend.users.entity.ExperienceEvent;
import com.hanapath.backend.users.service.ExperienceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Base64;
import java.time.LocalDateTime;
import java.util.UUID;
import java.math.BigDecimal;

import java.util.List;
import java.util.stream.Collectors;
import com.hanapath.backend.wallet.entity.Wallet;
import com.hanapath.backend.wallet.repository.WalletRepository;
import com.hanapath.backend.wallet.service.WalletTransactionService;
import com.hanapath.backend.wallet.dto.WalletTransactionDto;

/**
 * 상품 관련 비즈니스 로직 처리
 */
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final PurchaseHistoryRepository purchaseHistoryRepository;
    private final HanaMoneyRepository hanaMoneyRepository;
    private final HanaMoneyTransactionRepository hanaMoneyTransactionRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final PasswordEncoder passwordEncoder;
    private final WalletTransactionService walletTransactionService;
    private final ExperienceService experienceService;

    /**
     * 전체 상품 목록 조회
     */
    public List<ProductResponseDto> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 카테고리별 상품 목록 조회
     */
    public List<ProductResponseDto> getProductsByCategory(String category) {
        return productRepository.findByCategory(category).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 키워드(이름 or 브랜드) 검색
     */
    public List<ProductResponseDto> searchProducts(String keyword) {
        return productRepository
                .findByNameContainingIgnoreCaseOrBrandContainingIgnoreCase(keyword, keyword).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 상품 상세 조회
     */
    public ProductResponseDto getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다: " + id));
        return convertToDto(product);
    }

    /**
     * 상품 구매 처리 (재고 차감, 하나머니 차감, 구매 내역 저장)
     */
    @Transactional
    public void purchaseProduct(PurchaseRequestDto request) {
        try {
            
            // 1. 상품 조회 및 재고 확인
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다: " + request.getProductId()));

        if (product.getStock() < request.getQuantity()) {
            throw new IllegalStateException("상품 재고가 부족합니다");
        }

        // 2. 사용자 조회
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + request.getUserId()));

        // 3. 총 결제 금액 계산
        int totalAmount = product.getPrice() * request.getQuantity();
        int hanaMoneyToUse = request.getUseHanaMoney() ? request.getHanaMoneyAmount() : 0;
        int walletAmount = totalAmount - hanaMoneyToUse;
        
        // 4. 전자지갑 사용이 필요한 경우 비밀번호 검증 및 잔액 확인
        Wallet wallet = null;
        if (walletAmount > 0) {
            // 전자지갑 정보 조회
            wallet = walletRepository.findByUserId(request.getUserId())
                    .orElseThrow(() -> new IllegalStateException("전자지갑을 찾을 수 없습니다"));
            
            // 비밀번호 검증
            if (request.getWalletPassword() == null || !passwordEncoder.matches(request.getWalletPassword(), wallet.getAccountPassword())) {
                throw new IllegalStateException("전자지갑 비밀번호가 일치하지 않습니다. 비밀번호를 다시 입력해주세요.");
            }
            
            // 전자지갑 잔액 확인
            if (wallet.getBalance().compareTo(BigDecimal.valueOf(walletAmount)) < 0) {
                throw new IllegalStateException("전자지갑 잔액이 부족합니다");
            }
        }

        // 5. 하나머니 조회
        HanaMoney hanaMoney = hanaMoneyRepository.findByUserId(request.getUserId())
                .orElseThrow(() -> new IllegalStateException("하나머니 계좌를 찾을 수 없습니다"));

        // 6. 하나머니 잔액 확인
        if (request.getUseHanaMoney() && hanaMoney.getBalance().compareTo(BigDecimal.valueOf(hanaMoneyToUse)) < 0) {
            throw new IllegalStateException("하나머니 잔액이 부족합니다");
        }

        // 7. 재고 감소
        product.setStock(product.getStock() - request.getQuantity());
        productRepository.save(product);
        
        // 결제 처리 시간을 늘리기 위한 지연
        for (int i = 0; i < 2; i++) {
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        // 8. 하나머니 차감 및 거래 내역 저장
        if (request.getUseHanaMoney() && hanaMoneyToUse > 0) {
            hanaMoney.subtractBalance(BigDecimal.valueOf(hanaMoneyToUse));
            hanaMoneyRepository.save(hanaMoney);

            // 하나머니 거래 내역 저장
            HanaMoneyTransaction transaction = HanaMoneyTransaction.builder()
                    .user(user)
                    .transactionType(HanaMoneyTransaction.TransactionType.USE)
                    .category(HanaMoneyTransaction.TransactionCategory.STORE)
                    .amount(BigDecimal.valueOf(-hanaMoneyToUse))
                    .balanceAfter(hanaMoney.getBalance())
                    .description(product.getName() + " 구매")
                    .referenceId(product.getId().toString())
                    .createdAt(LocalDateTime.now())
                    .build();
            hanaMoneyTransactionRepository.save(transaction);
        }

        // 9. 전자지갑 차감 및 거래 내역 생성
        if (walletAmount > 0 && wallet != null) {
            wallet.setBalance(wallet.getBalance().subtract(BigDecimal.valueOf(walletAmount)));
            walletRepository.save(wallet);

            // 전자 지갑 거래 내역 생성
            walletTransactionService.createTransaction(
                request.getUserId(),
                WalletTransactionDto.CreateRequestDto.builder()
                    .title(product.getName() + " 구매")
                    .category("스토어")
                    .amount(BigDecimal.valueOf(-walletAmount))
                    .description(product.getName() + " 구매")
                    .build()
            );
        }

        // 10. 구매 내역 저장
        LocalDateTime purchaseDate = LocalDateTime.now();
        LocalDateTime expiryDate = purchaseDate.plusDays(product.getValidDays());
        
        PurchaseHistory purchaseHistory = PurchaseHistory.builder()
                .userId(request.getUserId())
                .productId(product.getId())
                .productName(product.getName())
                .productBrand(product.getBrand())
                .productCategory(product.getCategory())
                .quantity(request.getQuantity())
                .totalPrice(totalAmount)
                .hanaMoneyUsed(hanaMoneyToUse)
                .walletAmount(walletAmount)
                .purchaseDate(purchaseDate)
                .expiryDate(expiryDate)
                .isUsed(false)
                .giftCode(generateGiftCode())
                .status(PurchaseHistory.PurchaseStatus.PURCHASED)
                .build();
        
        purchaseHistoryRepository.save(purchaseHistory);
        try {
            experienceService.awardExp(request.getUserId(), ExperienceEvent.ExperienceType.STORE_PURCHASE, String.valueOf(purchaseHistory.getId()));
        } catch (Exception ignored) {}
        } catch (Exception e) {
            throw e;
        }
    }

    /**
     * 사용자의 구매 내역 조회
     */
    public List<PurchaseHistory> getUserPurchaseHistory(Long userId) {
        return purchaseHistoryRepository.findByUserIdOrderByPurchaseDateDesc(userId);
    }

    /**
     * 사용자의 사용 가능한 기프티콘 조회
     */
    public List<PurchaseHistory> getUserValidGifticons(Long userId) {
        return purchaseHistoryRepository.findValidGifticonsByUserId(userId, LocalDateTime.now());
    }

    /**
     * 사용자의 만료된 기프티콘 조회
     */
    public List<PurchaseHistory> getUserExpiredGifticons(Long userId) {
        return purchaseHistoryRepository.findExpiredGifticonsByUserId(userId, LocalDateTime.now());
    }

    /**
     * 기프티콘 사용 처리
     */
    @Transactional
    public void useGifticon(Long purchaseHistoryId, Long userId) {
        PurchaseHistory purchaseHistory = purchaseHistoryRepository.findById(purchaseHistoryId)
                .orElseThrow(() -> new IllegalArgumentException("구매 내역을 찾을 수 없습니다"));

        if (!purchaseHistory.getUserId().equals(userId)) {
            throw new IllegalStateException("본인의 기프티콘만 사용할 수 있습니다");
        }

        if (purchaseHistory.getStatus() != PurchaseHistory.PurchaseStatus.PURCHASED) {
            throw new IllegalStateException("이미 사용되었거나 만료된 기프티콘입니다");
        }

        if (purchaseHistory.getExpiryDate().isBefore(LocalDateTime.now())) {
            purchaseHistory.setStatus(PurchaseHistory.PurchaseStatus.EXPIRED);
            purchaseHistoryRepository.save(purchaseHistory);
            throw new IllegalStateException("만료된 기프티콘입니다");
        }

        purchaseHistory.setIsUsed(true);
        purchaseHistory.setStatus(PurchaseHistory.PurchaseStatus.USED);
        purchaseHistoryRepository.save(purchaseHistory);
    }

    /**
     * 기프티콘 코드 생성
     */
    private String generateGiftCode() {
        return "GIFT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    /**
     * Entity → DTO 변환
     */
    private ProductResponseDto convertToDto(Product product) {
        String base64Image = null;
        if (product.getImageData() != null) {
            base64Image = Base64.getEncoder().encodeToString(product.getImageData());
        }

        return ProductResponseDto.builder()
                .id(product.getId())
                .name(product.getName())
                .brand(product.getBrand())
                .category(product.getCategory())
                .price(product.getPrice())
                .originalPrice(product.getOriginalPrice())
                .isPopular(product.getIsPopular())
                .discount(product.getDiscount())
                .stock(product.getStock())
                .validDays(product.getValidDays())
                .vendor(product.getVendor())
                .description(product.getDescription())
                .imageBase64(base64Image)  
                .build();
    }

}

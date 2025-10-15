package com.hanapath.backend.store.controller;

import com.hanapath.backend.store.dto.ProductResponseDto;
import com.hanapath.backend.store.dto.PurchaseRequestDto;
import com.hanapath.backend.store.entity.PurchaseHistory;
import com.hanapath.backend.store.service.ProductService;
import com.hanapath.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/store")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final UserRepository userRepository;

    /**
     * 전체 상품 조회
     */
    @GetMapping("/products")
    public ResponseEntity<List<ProductResponseDto>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    /**
     * 카테고리별 상품 조회
     */
    @GetMapping("/products/category")
    public ResponseEntity<List<ProductResponseDto>> getProductsByCategory(@RequestParam String category) {
        return ResponseEntity.ok(productService.getProductsByCategory(category));
    }

    /**
     * 상품 검색 (이름 또는 브랜드 기준)
     */
    @GetMapping("/products/search")
    public ResponseEntity<List<ProductResponseDto>> searchProducts(@RequestParam String query) {
        return ResponseEntity.ok(productService.searchProducts(query));
    }

    /**
     * 상품 상세 조회
     */
    @GetMapping("/products/{id}")
    public ResponseEntity<ProductResponseDto> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    /**
     * 상품 구매 요청
     */
    @PostMapping("/purchase")
    public ResponseEntity<String> purchaseProduct(@RequestBody PurchaseRequestDto request) {
        // 인증된 사용자 정보 가져오기
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("인증이 필요합니다.");
        }
        
        // 인증된 사용자 ID 추출
        Object principal = authentication.getPrincipal();
        Long authenticatedUserId = null;
        
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            try {
                java.lang.reflect.Method getUserIdMethod = principal.getClass().getMethod("getUserId");
                authenticatedUserId = (Long) getUserIdMethod.invoke(principal);
            } catch (Exception e) {
                String email = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
                authenticatedUserId = userRepository.findByEmail(email).map(user -> user.getId()).orElse(null);
            }
        }
        
        // 요청의 사용자 ID와 인증된 사용자 ID가 일치하는지 확인
        if (authenticatedUserId != null && !authenticatedUserId.equals(request.getUserId())) {
            return ResponseEntity.status(403).body("본인의 계정으로만 구매할 수 있습니다.");
        }
        
        productService.purchaseProduct(request);
        return ResponseEntity.ok("상품 구매가 완료되었습니다.");
    }

    /**
     * 사용자의 구매 내역 조회
     */
    @GetMapping("/purchase-history/{userId}")
    public ResponseEntity<List<PurchaseHistory>> getUserPurchaseHistory(@PathVariable Long userId) {
        return ResponseEntity.ok(productService.getUserPurchaseHistory(userId));
    }

    /**
     * 사용자의 사용 가능한 기프티콘 조회
     */
    @GetMapping("/gifticons/valid/{userId}")
    public ResponseEntity<List<PurchaseHistory>> getUserValidGifticons(@PathVariable Long userId) {
        return ResponseEntity.ok(productService.getUserValidGifticons(userId));
    }

    /**
     * 사용자의 만료된 기프티콘 조회
     */
    @GetMapping("/gifticons/expired/{userId}")
    public ResponseEntity<List<PurchaseHistory>> getUserExpiredGifticons(@PathVariable Long userId) {
        return ResponseEntity.ok(productService.getUserExpiredGifticons(userId));
    }

    /**
     * 기프티콘 사용 처리
     */
    @PostMapping("/gifticons/{purchaseHistoryId}/use")
    public ResponseEntity<String> useGifticon(@PathVariable Long purchaseHistoryId, @RequestParam Long userId) {
        productService.useGifticon(purchaseHistoryId, userId);
        return ResponseEntity.ok("기프티콘이 사용되었습니다.");
    }
}

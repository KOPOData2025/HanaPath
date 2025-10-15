package com.hanapath.backend.wallet.service;

import com.hanapath.backend.users.entity.User;
import com.hanapath.backend.users.entity.UserRelationship;
import com.hanapath.backend.users.entity.UserType;
import com.hanapath.backend.users.repository.UserRepository;
import com.hanapath.backend.users.repository.UserRelationshipRepository;
import com.hanapath.backend.wallet.dto.WalletDto;
import com.hanapath.backend.wallet.dto.WalletTransactionDto;
import com.hanapath.backend.wallet.entity.Wallet;
import com.hanapath.backend.wallet.repository.WalletRepository;
import com.hanapath.backend.wallet.entity.WalletTransaction;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final UserRepository userRepository;
    private final UserRelationshipRepository relationshipRepository;
    private final PasswordEncoder passwordEncoder;
    private final WalletTransactionService transactionService;

    // 지갑 생성
    @Transactional
    public WalletDto.ResponseDto createWallet(Long userId, WalletDto.CreateRequestDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        // 이미 지갑이 있는지 확인
        if (walletRepository.existsByUserId(userId)) {
            throw new IllegalArgumentException("이미 디지털 지갑이 존재합니다.");
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
        String accountNumber = generateWalletAccountNumber();

        // 지갑 생성
        Wallet wallet = Wallet.builder()
                .user(user)
                .accountNumber(accountNumber)
                .accountPassword(passwordEncoder.encode(dto.getAccountPassword()))
                .build();

        Wallet savedWallet = walletRepository.save(wallet);
        
        System.out.println("=== 전자 지갑 생성 완료 ===");
        System.out.println("사용자 ID: " + userId);
        System.out.println("계좌번호: " + savedWallet.getAccountNumber());
        System.out.println("잔액: " + savedWallet.getBalance());
        
        return WalletDto.ResponseDto.fromEntity(savedWallet);
    }

    // 지갑 조회
    public WalletDto.ResponseDto getWallet(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("디지털 지갑이 존재하지 않습니다."));

        return WalletDto.ResponseDto.fromEntity(wallet);
    }

    // 지갑 잔액 조회
    public WalletDto.BalanceDto getBalance(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("디지털 지갑이 존재하지 않습니다."));

        return WalletDto.BalanceDto.builder()
                .balance(wallet.getBalance())
                .accountNumber(wallet.getAccountNumber())
                .status(wallet.getStatus().toString())
                .build();
    }

    // 지갑 소유 여부 확인
    public boolean hasWallet(Long userId) {
        return walletRepository.existsByUserId(userId);
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
            throw new IllegalArgumentException("청소년 사용자는 부모와의 관계가 승인된 후 디지털 지갑을 생성할 수 있습니다.");
        }
    }

    // 지갑 계좌번호 생성 (620 + 6자리 + 5자리 = 14자리 숫자)
    private String generateWalletAccountNumber() {
        Random random = new Random();
        String accountNumber;
        
        do {
            StringBuilder sb = new StringBuilder("620");
            
            // 6자리 랜덤 숫자
            for (int i = 0; i < 6; i++) {
                sb.append(random.nextInt(10));
            }
            
            // 5자리 랜덤 숫자
            for (int i = 0; i < 5; i++) {
                sb.append(random.nextInt(10));
            }
            
            accountNumber = sb.toString();
        } while (walletRepository.existsByAccountNumber(accountNumber));
        
        return accountNumber;
    }

    // 계좌번호 하이픈 포맷팅 (620-123456-12345)
    private String formatAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.length() != 14) {
            return accountNumber;
        }
        
        return accountNumber.substring(0, 3) + "-" + 
               accountNumber.substring(3, 9) + "-" + 
               accountNumber.substring(9, 14);
    }

    // 송금 실행
    @Transactional
    public WalletDto.TransferResponseDto transfer(WalletDto.TransferRequestDto dto) {

        Long currentUserId = getCurrentUserId(); 
        
        // 송금자 정보 조회
        User sender = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("송금자 정보를 찾을 수 없습니다."));
        Wallet senderWallet = walletRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("송금자의 전자 지갑이 존재하지 않습니다."));
        
        // 수신자 정보 조회
        User recipient = userRepository.findById(dto.getRecipientId())
                .orElseThrow(() -> new IllegalArgumentException("수신자 정보를 찾을 수 없습니다."));
        Wallet recipientWallet = walletRepository.findByUserId(dto.getRecipientId())
                .orElseThrow(() -> new IllegalArgumentException("수신자의 전자 지갑이 존재하지 않습니다."));
        
        // 송금자와 수신자가 같은지 확인
        if (currentUserId.equals(dto.getRecipientId())) {
            throw new IllegalArgumentException("자기 자신에게는 송금할 수 없습니다.");
        }
        
        // 송금 금액 검증
        if (dto.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("송금 금액은 0보다 커야 합니다.");
        }
        
        // 송금자 잔액 확인
        if (senderWallet.getBalance().compareTo(dto.getAmount()) < 0) {
            throw new IllegalArgumentException("잔액이 부족합니다.");
        }
        
        // 비밀번호 확인
        if (!passwordEncoder.matches(dto.getPassword(), senderWallet.getAccountPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }
        
        // 송금 실행
        BigDecimal senderBalanceAfter = senderWallet.getBalance().subtract(dto.getAmount());
        BigDecimal recipientBalanceAfter = recipientWallet.getBalance().add(dto.getAmount());
        
        senderWallet.setBalance(senderBalanceAfter);
        recipientWallet.setBalance(recipientBalanceAfter);
        
        // 지갑 정보 업데이트
        walletRepository.save(senderWallet);
        walletRepository.save(recipientWallet);
        
        // 송금자 거래 내역 생성
        transactionService.createTransaction(
            currentUserId,
            WalletTransactionDto.CreateRequestDto.builder()
                .title(recipient.getName())
                .category("송금")
                .amount(dto.getAmount().negate())
                .description("송금")
                .memo(dto.getDescription() != null && dto.getDescription().contains(" - ") 
                    ? dto.getDescription().split(" - ")[1] 
                    : null) // 메모 부분만 추출
                .relatedAccountNumber(recipientWallet.getAccountNumber())
                .build()
        );
        
        // 수신자 거래 내역 생성
        transactionService.createTransaction(
            dto.getRecipientId(),
            WalletTransactionDto.CreateRequestDto.builder()
                .title(sender.getName())
                .category("입금")
                .amount(dto.getAmount())
                .description("송금 입금")
                .memo("송금 입금 (" + formatAccountNumber(senderWallet.getAccountNumber()) + ")")
                .relatedAccountNumber(senderWallet.getAccountNumber())
                .build()
        );
        
        return WalletDto.TransferResponseDto.builder()
                .transactionId(System.currentTimeMillis()) 
                .senderAccountNumber(senderWallet.getAccountNumber())
                .recipientAccountNumber(recipientWallet.getAccountNumber())
                .amount(dto.getAmount())
                .senderBalanceAfter(senderBalanceAfter)
                .recipientBalanceAfter(recipientBalanceAfter)
                .status("COMPLETED")
                .transferDate(LocalDateTime.now())
                .build();
    }
    
    // 현재 사용자 ID 가져오기
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("인증이 필요합니다.");
        }
        
        Object principal = authentication.getPrincipal();
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            try {
                // CustomUserDetails에서 사용자 ID 추출
                java.lang.reflect.Method getUserIdMethod = principal.getClass().getMethod("getUserId");
                return (Long) getUserIdMethod.invoke(principal);
            } catch (Exception e) {
                // 리플렉션 실패 시 username(ID)을 직접 파싱
                String userIdStr = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
                return Long.parseLong(userIdStr);
            }
        }
        
        throw new IllegalArgumentException("사용자 정보를 찾을 수 없습니다.");
    }

    // 비밀번호 검증
    public boolean validatePassword(WalletDto.PasswordValidationDto dto) {
        Long currentUserId = getCurrentUserId();
        
        Wallet wallet = walletRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("전자 지갑이 존재하지 않습니다."));
        
        return passwordEncoder.matches(dto.getPassword(), wallet.getAccountPassword());
    }

    // 거래 내역 메모 업데이트
    @Transactional
    public WalletTransactionDto.ResponseDto updateTransactionMemo(Long transactionId, WalletTransactionDto.MemoUpdateDto dto) {
        Long currentUserId = getCurrentUserId();
        
        // 거래 내역 조회
        WalletTransaction transaction = transactionService.getTransactionById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("거래 내역을 찾을 수 없습니다."));
        
        // 본인의 거래 내역인지 확인
        if (!transaction.getUser().getId().equals(currentUserId)) {
            throw new IllegalArgumentException("본인의 거래 내역만 수정할 수 있습니다.");
        }
        
        // 메모 업데이트
        transaction.setMemo(dto.getMemo());
        WalletTransaction updatedTransaction = transactionService.saveTransaction(transaction);
        
        return WalletTransactionDto.ResponseDto.fromEntity(updatedTransaction);
    }
}
package com.hanapath.backend.users.service;

import com.hanapath.backend.users.dto.*;
import com.hanapath.backend.users.entity.User;
import com.hanapath.backend.users.entity.UserRelationship;
import com.hanapath.backend.users.repository.UserRepository;
import com.hanapath.backend.users.repository.UserRelationshipRepository;
import com.hanapath.backend.users.util.JwtUtil;
import com.hanapath.backend.wallet.repository.WalletRepository;
import com.hanapath.backend.account.repository.InvestmentAccountRepository;
import com.hanapath.backend.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.hanapath.backend.hanamoney.service.HanaMoneyService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final UserRelationshipRepository relationshipRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final WalletRepository walletRepository;
    private final InvestmentAccountRepository investmentAccountRepository;
    private final HanaMoneyService hanaMoneyService;
    private final NotificationService notificationService;

    // 회원가입 처리
    public void signup(UserSignupRequestDto dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");
        }

        // 전화번호 중복 체크 추가
        if (userRepository.existsByPhone(dto.getPhone())) {
            throw new IllegalArgumentException("이미 사용 중인 휴대폰 번호입니다.");
        }

        User user = User.builder()
                .userType(dto.getUserType())
                .name(dto.getName())
                .nationalIdFront(dto.getNationalIdFront())
                .nationalIdBackFirst(dto.getNationalIdBackFirst())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .phone(dto.getPhone())
                .termsAgreed(dto.isTermsAgreed())
                .isPhoneVerified(false)
                .level(1)
                .totalExp(0)
                .build();

        userRepository.save(user);

        // 회원가입 보너스 5000P 지급
        try {
            Long userId = user.getId();
            if (userId != null) {
                hanaMoneyService.processSignupBonus(userId);
            }
        } catch (Exception e) {
            log.error("회원가입 보너스 지급 실패: email={}, error={}", dto.getEmail(), e.getMessage());
        }
    }

    // 로그인 처리
    public LoginResponseDto login(UserLoginRequestDto dto) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 이메일입니다."));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // JWT 토큰 생성
        String token = jwtUtil.generateToken(user.getEmail(), user.getId());
        
        // 계좌 소유 여부 확인
        boolean hasWallet = walletRepository.existsByUserId(user.getId());
        boolean hasInvestmentAccount = investmentAccountRepository.existsByUserId(user.getId());
        boolean hasParentRelation = hasParentRelation(user.getId());
        
        return LoginResponseDto.builder()
                .user(UserResponseDto.fromEntity(user, hasWallet, hasInvestmentAccount, hasParentRelation))
                .token(token)
                .build();
    }

    // 이메일 중복 확인
    public boolean checkEmailDuplicate(String email) {
        return userRepository.existsByEmail(email);
    }

    // 전화번호 중복 확인
    public boolean checkPhoneDuplicate(String phone) {
        return userRepository.existsByPhone(phone);
    }

    // 닉네임 중복 확인
    public boolean checkNicknameDuplicate(String nickname) {
        return userRepository.existsByNickname(nickname);
    }

    // 이메일로 사용자 조회
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
    }

    // 사용자 정보 업데이트
    @Transactional
    public UserResponseDto updateUser(Long userId, UserUpdateDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        if (dto.getNickname() != null && !dto.getNickname().equals(user.getNickname())) {
            if (userRepository.existsByNickname(dto.getNickname())) {
                throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
            }
            user.setNickname(dto.getNickname());
        }

        if (dto.getPhone() != null && !dto.getPhone().equals(user.getPhone())) {
            if (userRepository.existsByPhone(dto.getPhone())) {
                throw new IllegalArgumentException("이미 사용 중인 휴대폰 번호입니다.");
            }
            user.setPhone(dto.getPhone());
        }

        userRepository.save(user);
        
        // 계좌 소유 여부 확인
        boolean hasWallet = walletRepository.existsByUserId(userId);
        boolean hasInvestmentAccount = investmentAccountRepository.existsByUserId(userId);
        boolean hasParentRelation = hasParentRelation(userId);
        
        return UserResponseDto.fromEntity(user, hasWallet, hasInvestmentAccount, hasParentRelation);
    }

    // 사용자 정보 조회
    public UserResponseDto getUserInfo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
        
        // 계좌 소유 여부 확인
        boolean hasWallet = walletRepository.existsByUserId(userId);
        boolean hasInvestmentAccount = investmentAccountRepository.existsByUserId(userId);
        boolean hasParentRelation = hasParentRelation(userId);
        
        return UserResponseDto.fromEntity(user, hasWallet, hasInvestmentAccount, hasParentRelation);
    }

    // 관계 요청 생성
    @Transactional
    public UserRelationshipDto.ResponseDto createRelationshipRequest(Long requesterId, UserRelationshipDto.RequestDto dto) {
        System.out.println("관계 요청 - 요청자 ID: " + requesterId);
        System.out.println("관계 요청 - 받을 사람 전화번호: " + dto.getReceiverPhone());
        
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new IllegalArgumentException("요청자를 찾을 수 없습니다."));

        User receiver = userRepository.findByPhone(dto.getReceiverPhone())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. 전화번호를 확인해주세요."));

        if (requesterId.equals(receiver.getId())) {
            throw new IllegalArgumentException("자기 자신에게는 관계 요청을 보낼 수 없습니다.");
        }

        // 이미 관계가 존재하는지 확인
        Optional<UserRelationship> existingRelationship = relationshipRepository.findRelationshipBetweenUsers(requesterId, receiver.getId());
        
        if (existingRelationship.isPresent()) {
            UserRelationship existing = existingRelationship.get();
            String status = existing.getStatus().toString();
            
            if ("PENDING".equals(status)) {
                throw new IllegalArgumentException("이미 관계 요청을 보냈습니다. 상대방의 응답을 기다려주세요.");
            } else if ("ACCEPTED".equals(status)) {
                throw new IllegalArgumentException("이미 승인된 관계입니다.");
            } else if ("REJECTED".equals(status)) {
                // 거절된 관계가 있으면 새로운 요청으로 업데이트
                existing.setStatus(UserRelationship.RelationshipStatus.PENDING);
                existing.setType(dto.getType());
                existing.setMessage(dto.getMessage());
                
                UserRelationship savedRelationship = relationshipRepository.save(existing);
                
                // 거절된 관계를 다시 요청할 때도 알림 생성
                String relationshipTypeLabel = getRelationshipTypeLabel(dto.getType());
                notificationService.createRelationshipRequestNotification(
                        receiver.getId(), 
                        requester.getName(), 
                        requester.getPhone(),
                        relationshipTypeLabel,
                        existing.getId()
                );
                
                return UserRelationshipDto.ResponseDto.fromEntity(savedRelationship);
            }
        }

        // 새로운 관계 요청 생성
        UserRelationship relationship = UserRelationship.builder()
                .requester(requester)
                .receiver(receiver)
                .status(UserRelationship.RelationshipStatus.PENDING)
                .type(dto.getType())
                .message(dto.getMessage())
                .build();

        UserRelationship savedRelationship = relationshipRepository.save(relationship);
        
        // 관계 요청 알림 생성
        String relationshipTypeLabel = getRelationshipTypeLabel(dto.getType());
        notificationService.createRelationshipRequestNotification(
                receiver.getId(), 
                requester.getName(), 
                requester.getPhone(),
                relationshipTypeLabel,
                savedRelationship.getId()
        );
        
        return UserRelationshipDto.ResponseDto.fromEntity(savedRelationship);
    }

    // 관계 요청 목록 조회 (받은 요청)
    public List<UserRelationshipDto.ResponseDto> getReceivedRequests(Long userId) {
        List<UserRelationship> relationships = relationshipRepository.findPendingRequestsByReceiverId(userId);
        return relationships.stream()
                .map(UserRelationshipDto.ResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 관계 요청 목록 조회 (보낸 요청)
    public List<UserRelationshipDto.ResponseDto> getSentRequests(Long userId) {
        List<UserRelationship> relationships = relationshipRepository.findRequestsByRequesterId(userId);
        return relationships.stream()
                .map(UserRelationshipDto.ResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 모든 관계 조회
    public List<UserRelationshipDto.ResponseDto> getAllRelationships(Long userId) {
        List<UserRelationship> relationships = relationshipRepository.findAllByUserId(userId);
        return relationships.stream()
                .map(UserRelationshipDto.ResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 관계 요청 상태 업데이트 (승인/거절)
    @Transactional
    public UserRelationshipDto.ResponseDto updateRelationshipStatus(Long userId, UserRelationshipDto.UpdateStatusDto dto) {
        UserRelationship relationship = relationshipRepository.findById(dto.getRelationshipId())
                .orElseThrow(() -> new IllegalArgumentException("관계 요청을 찾을 수 없습니다."));

        // 수신자만 상태를 변경할 수 있음
        if (!relationship.getReceiver().getId().equals(userId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }

        if (relationship.getStatus() != UserRelationship.RelationshipStatus.PENDING) {
            throw new IllegalArgumentException("이미 처리된 요청입니다.");
        }

        relationship.setStatus(dto.getStatus());
        UserRelationship savedRelationship = relationshipRepository.save(relationship);
        
        // 관계 승인/거절 알림 생성
        String relationshipTypeLabel = getRelationshipTypeLabel(relationship.getType());
        if (dto.getStatus() == UserRelationship.RelationshipStatus.ACCEPTED) {
            notificationService.createRelationshipApprovedNotification(
                    relationship.getRequester().getId(),
                    relationship.getReceiver().getName(),
                    relationship.getReceiver().getPhone(),
                    relationshipTypeLabel
            );
        } else if (dto.getStatus() == UserRelationship.RelationshipStatus.REJECTED) {
            notificationService.createRelationshipRejectedNotification(
                    relationship.getRequester().getId(),
                    relationship.getReceiver().getName(),
                    relationship.getReceiver().getPhone(),
                    relationshipTypeLabel
            );
        }
        
        return UserRelationshipDto.ResponseDto.fromEntity(savedRelationship);
    }

    // 관계 삭제
    @Transactional
    public void deleteRelationship(Long userId, Long relationshipId) {
        UserRelationship relationship = relationshipRepository.findById(relationshipId)
                .orElseThrow(() -> new IllegalArgumentException("관계를 찾을 수 없습니다."));

        // 요청자나 수신자만 삭제할 수 있음
        if (!relationship.getRequester().getId().equals(userId) && 
            !relationship.getReceiver().getId().equals(userId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }

        relationshipRepository.delete(relationship);
    }

    // 부모 관계 확인 (TEEN 사용자용)
    public boolean hasParentRelation(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        // PARENT 사용자는 항상 true 반환 (계좌 개설 가능)
        if (user.getUserType() == com.hanapath.backend.users.entity.UserType.PARENT) {
            return true;
        }

        // TEEN 사용자의 경우 승인된 부모 관계가 있는지 확인
        List<UserRelationship> relationships = relationshipRepository.findByUserIdAndStatus(
                userId, UserRelationship.RelationshipStatus.ACCEPTED);

        return relationships.stream()
                .anyMatch(rel -> rel.getType() == UserRelationship.RelationshipType.PARENT_CHILD &&
                        ((rel.getRequester().getId().equals(userId) && rel.getReceiver().getUserType() == com.hanapath.backend.users.entity.UserType.PARENT) ||
                         (rel.getReceiver().getId().equals(userId) && rel.getRequester().getUserType() == com.hanapath.backend.users.entity.UserType.PARENT)));
    }

    // 사용자 검색 (전화번호 또는 계좌번호로)
    public UserSearchResponseDto searchUser(String type, String value) {
        User user;
        String accountNumber = null;
        
        // 하이픈 제거
        String cleanValue = value.replaceAll("-", "");
        
        if ("phone".equals(type)) {
            user = userRepository.findByPhone(cleanValue)
                    .orElseThrow(() -> new IllegalArgumentException("해당 전화번호로 등록된 사용자를 찾을 수 없습니다."));
        } else if ("account".equals(type)) {
            // 계좌번호로 지갑을 찾고, 해당 지갑의 사용자 정보를 가져오기
            var wallet = walletRepository.findByAccountNumber(cleanValue)
                    .orElseThrow(() -> new IllegalArgumentException("해당 계좌번호로 등록된 사용자를 찾을 수 없습니다."));
            user = wallet.getUser();
            accountNumber = wallet.getAccountNumber();
        } else {
            throw new IllegalArgumentException("잘못된 검색 타입입니다. 'phone' 또는 'account'를 사용해주세요.");
        }
        
        // 계좌번호가 null인 경우 사용자의 지갑에서 가져오기
        if (accountNumber == null) {
            var wallet = walletRepository.findByUserId(user.getId());
            accountNumber = wallet.map(w -> w.getAccountNumber()).orElse(null);
        }
        
        return UserSearchResponseDto.fromEntity(user, accountNumber);
    }

    /**
     * 관계 타입을 한국어로 변환
     */
    private String getRelationshipTypeLabel(UserRelationship.RelationshipType type) {
        switch (type) {
            case PARENT_CHILD:
                return "부모-자식";
            case SIBLING:
                return "형제자매";
            case FRIEND:
                return "친구";
            default:
                return "관계";
        }
    }
}
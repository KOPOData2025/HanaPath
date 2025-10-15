package com.hanapath.backend.wallet.service;

import com.hanapath.backend.users.entity.User;
import com.hanapath.backend.users.entity.UserRelationship;
import com.hanapath.backend.users.entity.UserType;
import com.hanapath.backend.users.repository.UserRepository;
import com.hanapath.backend.users.repository.UserRelationshipRepository;
import com.hanapath.backend.wallet.dto.AllowanceScheduleDto;
import com.hanapath.backend.wallet.dto.WalletTransactionDto;
import com.hanapath.backend.wallet.entity.AllowanceSchedule;
import com.hanapath.backend.wallet.entity.Wallet;
import com.hanapath.backend.wallet.entity.WalletTransaction;
import com.hanapath.backend.wallet.repository.AllowanceScheduleRepository;
import com.hanapath.backend.wallet.repository.WalletRepository;
import com.hanapath.backend.wallet.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AllowanceScheduleService {

    private final AllowanceScheduleRepository allowanceScheduleRepository;
    private final UserRepository userRepository;
    private final UserRelationshipRepository relationshipRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;

    /**
     * 용돈 스케줄 생성
     */
    @Transactional
    public AllowanceScheduleDto.ResponseDto createAllowanceSchedule(AllowanceScheduleDto.CreateRequestDto requestDto) {
        // 부모 사용자 검증 
        if (requestDto.getParentId() == null) {
            throw new IllegalArgumentException("부모 사용자 ID가 필요합니다.");
        }
        
        User parent = userRepository.findById(requestDto.getParentId())
                .orElseThrow(() -> new IllegalArgumentException("부모 사용자를 찾을 수 없습니다."));
        
        if (parent.getUserType() != UserType.PARENT) {
            throw new IllegalArgumentException("부모 사용자만 용돈 스케줄을 생성할 수 있습니다.");
        }

        // 자식 사용자 검증
        User child = userRepository.findById(requestDto.getChildId())
                .orElseThrow(() -> new IllegalArgumentException("자식 사용자를 찾을 수 없습니다."));
        
        if (child.getUserType() != UserType.TEEN) {
            throw new IllegalArgumentException("자식 사용자만 용돈 대상이 될 수 있습니다.");
        }

        // 부모-자식 관계 검증
        validateParentChildRelationship(parent.getId(), child.getId());

        // 기존 스케줄이 있는지 확인
        Optional<AllowanceSchedule> existingSchedule = allowanceScheduleRepository
                .findByParentIdAndChildIdAndStatus(parent.getId(), child.getId(), AllowanceSchedule.ScheduleStatus.ACTIVE);
        
        if (existingSchedule.isPresent()) {
            throw new IllegalArgumentException("이미 활성화된 용돈 스케줄이 존재합니다.");
        }

        // 지급일 검증 (1-31)
        if (requestDto.getPaymentDay() < 1 || requestDto.getPaymentDay() > 31) {
            throw new IllegalArgumentException("지급일은 1일부터 31일 사이여야 합니다.");
        }

        // 용돈 금액 검증 (최소 1,000원)
        if (requestDto.getAmount().compareTo(new BigDecimal("1000")) < 0) {
            throw new IllegalArgumentException("용돈은 최소 1,000원 이상이어야 합니다.");
        }

        // 스케줄 생성
        AllowanceSchedule schedule = AllowanceSchedule.builder()
                .parent(parent)
                .child(child)
                .amount(requestDto.getAmount())
                .paymentDay(requestDto.getPaymentDay())
                .status(AllowanceSchedule.ScheduleStatus.ACTIVE)
                .lastPaymentDate(LocalDateTime.now().minusMonths(1)) // 초기값 설정
                .build();

        // 다음 지급일 계산
        schedule.calculateNextPaymentDate();

        AllowanceSchedule savedSchedule = allowanceScheduleRepository.save(schedule);
        return AllowanceScheduleDto.ResponseDto.fromEntity(savedSchedule);
    }

    /**
     * 부모의 모든 용돈 스케줄 조회
     */
    public List<AllowanceScheduleDto.ResponseDto> getParentSchedules(Long parentId) {
        List<AllowanceSchedule> schedules = allowanceScheduleRepository
                .findByParentIdAndStatus(parentId, AllowanceSchedule.ScheduleStatus.ACTIVE);
        
        return schedules.stream()
                .map(AllowanceScheduleDto.ResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 자식의 모든 용돈 스케줄 조회
     */
    public List<AllowanceScheduleDto.ResponseDto> getChildSchedules(Long childId) {
        List<AllowanceSchedule> schedules = allowanceScheduleRepository
                .findByChildIdAndStatus(childId, AllowanceSchedule.ScheduleStatus.ACTIVE);
        
        return schedules.stream()
                .map(AllowanceScheduleDto.ResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 용돈 스케줄 상태 업데이트
     */
    @Transactional
    public AllowanceScheduleDto.ResponseDto updateScheduleStatus(AllowanceScheduleDto.UpdateStatusDto requestDto) {
        AllowanceSchedule schedule = allowanceScheduleRepository.findById(requestDto.getScheduleId())
                .orElseThrow(() -> new IllegalArgumentException("용돈 스케줄을 찾을 수 없습니다."));

        try {
            AllowanceSchedule.ScheduleStatus newStatus = AllowanceSchedule.ScheduleStatus.valueOf(requestDto.getStatus());
            schedule.setStatus(newStatus);
            
            AllowanceSchedule savedSchedule = allowanceScheduleRepository.save(schedule);
            return AllowanceScheduleDto.ResponseDto.fromEntity(savedSchedule);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 상태값입니다.");
        }
    }

    /**
     * 용돈 스케줄 삭제
     */
    @Transactional
    public void deleteSchedule(Long scheduleId, Long userId) {
        AllowanceSchedule schedule = allowanceScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("용돈 스케줄을 찾을 수 없습니다."));

        // 부모만 삭제 가능
        if (!schedule.getParent().getId().equals(userId)) {
            throw new IllegalArgumentException("용돈 스케줄을 삭제할 권한이 없습니다.");
        }

        schedule.setStatus(AllowanceSchedule.ScheduleStatus.CANCELLED);
        allowanceScheduleRepository.save(schedule);
    }

    /**
     * 매일 자정에 실행되는 용돈 자동 지급 스케줄러
     */
    @Scheduled(cron = "0 00 00 * * ?") // 매일 자정
    @Transactional
    public void processAllowancePayments() {
        log.info("용돈 자동 지급 처리 시작");
        
        try {
            LocalDateTime now = LocalDateTime.now();
            List<AllowanceSchedule> dueSchedules = allowanceScheduleRepository.findDueSchedules(now);
            
            log.info("지급 예정 스케줄 수: {}", dueSchedules.size());
            
            int successCount = 0;
            int failCount = 0;
            
            for (AllowanceSchedule schedule : dueSchedules) {
                try {
                    processAllowancePayment(schedule);
                    successCount++;
                } catch (Exception e) {
                    failCount++;
                    log.error("용돈 지급 처리 실패 - 스케줄 ID: {}, 부모: {}, 자식: {}, 오류: {}", 
                            schedule.getId(), 
                            schedule.getParent().getName(), 
                            schedule.getChild().getName(), 
                            e.getMessage());
                }
            }
            
            log.info("용돈 자동 지급 처리 완료 - 성공: {}, 실패: {}", successCount, failCount);
            
        } catch (Exception e) {
            log.error("용돈 자동 지급 스케줄러 실행 중 오류 발생", e);
        }
    }

    /**
     * 개별 용돈 지급 처리
     */
    @Transactional
    public void processAllowancePayment(AllowanceSchedule schedule) {
        // 부모 지갑 조회
        Wallet parentWallet = walletRepository.findByUserId(schedule.getParent().getId())
                .orElseThrow(() -> new IllegalArgumentException("부모 지갑을 찾을 수 없습니다."));

        // 자식 지갑 조회
        Wallet childWallet = walletRepository.findByUserId(schedule.getChild().getId())
                .orElseThrow(() -> new IllegalArgumentException("자식 지갑을 찾을 수 없습니다."));

        // 부모 지갑 잔액 확인
        if (parentWallet.getBalance().compareTo(schedule.getAmount()) < 0) {
            log.warn("부모 지갑 잔액 부족 - 부모 ID: {}, 필요 금액: {}, 현재 잔액: {}", 
                    schedule.getParent().getId(), schedule.getAmount(), parentWallet.getBalance());
            return;
        }

        // 현재 월 정보
        String currentMonth = LocalDateTime.now().format(DateTimeFormatter.ofPattern("M월"));
        
        // 부모 지갑에서 출금
        parentWallet.subtractBalance(schedule.getAmount());
        walletRepository.save(parentWallet);

        // 자식 지갑에 입금
        childWallet.addBalance(schedule.getAmount());
        walletRepository.save(childWallet);

        // 부모 거래 내역 생성 (송금)
        WalletTransaction parentTransaction = WalletTransaction.builder()
                .user(schedule.getParent())
                .title(currentMonth + " 용돈")
                .category("송금")
                .amount(schedule.getAmount().negate()) // 음수로 설정
                .transactionDate(LocalDateTime.now())
                .description(schedule.getChild().getName() + "에게 용돈 송금")
                .relatedAccountNumber(childWallet.getAccountNumber())
                .type(WalletTransaction.TransactionType.EXPENSE)
                .build();
        transactionRepository.save(parentTransaction);

        // 자식 거래 내역 생성 (용돈)
        WalletTransaction childTransaction = WalletTransaction.builder()
                .user(schedule.getChild())
                .title(currentMonth + " 용돈")
                .category("용돈")
                .amount(schedule.getAmount()) // 양수로 설정
                .transactionDate(LocalDateTime.now())
                .description(schedule.getParent().getName() + "으로부터 용돈 수령")
                .relatedAccountNumber(parentWallet.getAccountNumber())
                .type(WalletTransaction.TransactionType.INCOME)
                .build();
        transactionRepository.save(childTransaction);

        // 스케줄 업데이트
        schedule.markAsPaid();
        allowanceScheduleRepository.save(schedule);

        log.info("용돈 지급 완료 - 부모: {}, 자식: {}, 금액: {}, 월: {}", 
                schedule.getParent().getName(), schedule.getChild().getName(), 
                schedule.getAmount(), currentMonth);
    }

    /**
     * 부모-자식 관계 검증
     */
    private void validateParentChildRelationship(Long parentId, Long childId) {
        List<UserRelationship> relationships = relationshipRepository.findByUserIdAndStatus(
                childId, UserRelationship.RelationshipStatus.ACCEPTED);

        boolean hasParentRelation = relationships.stream()
                .anyMatch(rel -> rel.getType() == UserRelationship.RelationshipType.PARENT_CHILD &&
                        ((rel.getRequester().getId().equals(parentId) && rel.getReceiver().getId().equals(childId)) ||
                         (rel.getReceiver().getId().equals(parentId) && rel.getRequester().getId().equals(childId))));

        if (!hasParentRelation) {
            throw new IllegalArgumentException("유효한 부모-자식 관계가 아닙니다.");
        }
    }
} 
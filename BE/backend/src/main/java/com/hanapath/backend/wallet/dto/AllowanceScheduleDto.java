package com.hanapath.backend.wallet.dto;

import com.hanapath.backend.wallet.entity.AllowanceSchedule;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class AllowanceScheduleDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequestDto {
        private Long parentId; 
        private Long childId;
        private BigDecimal amount;
        private Integer paymentDay;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResponseDto {
        private Long id;
        private Long parentId;
        private String parentName;
        private Long childId;
        private String childName;
        private BigDecimal amount;
        private Integer paymentDay;
        private String status;
        private LocalDateTime lastPaymentDate;
        private LocalDateTime nextPaymentDate;
        private LocalDateTime createdAt;

        public static ResponseDto fromEntity(AllowanceSchedule schedule) {
            return ResponseDto.builder()
                    .id(schedule.getId())
                    .parentId(schedule.getParent().getId())
                    .parentName(schedule.getParent().getName())
                    .childId(schedule.getChild().getId())
                    .childName(schedule.getChild().getName())
                    .amount(schedule.getAmount())
                    .paymentDay(schedule.getPaymentDay())
                    .status(schedule.getStatus().name())
                    .lastPaymentDate(schedule.getLastPaymentDate())
                    .nextPaymentDate(schedule.getNextPaymentDate())
                    .createdAt(schedule.getCreatedAt())
                    .build();
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateStatusDto {
        private Long scheduleId;
        private String status; // ACTIVE, PAUSED, CANCELLED
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentHistoryDto {
        private Long id;
        private String title;
        private BigDecimal amount;
        private LocalDateTime paymentDate;
        private String parentName;
        private String childName;

        public static PaymentHistoryDto fromTransaction(WalletTransactionDto.ResponseDto transaction) {
            return PaymentHistoryDto.builder()
                    .id(transaction.getId())
                    .title(transaction.getTitle())
                    .amount(transaction.getAmount())
                    .paymentDate(transaction.getTransactionDate())
                    .build();
        }
    }
} 
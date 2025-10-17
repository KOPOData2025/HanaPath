package com.hanapath.backend.users.dto;

import com.hanapath.backend.users.entity.UserRelationship;
import lombok.*;

import java.time.LocalDateTime;

public class UserRelationshipDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RequestDto {
        private String receiverPhone; // 수신자 전화번호
        private UserRelationship.RelationshipType type; // 관계 유형
        private String message; // 요청 메시지
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResponseDto {
        private Long id;
        private Long requesterId;
        private String requesterName;
        private String requesterNickname;
        private String requesterPhone;
        private Long receiverId;
        private String receiverName;
        private String receiverNickname;
        private String receiverPhone;
        private UserRelationship.RelationshipStatus status;
        private UserRelationship.RelationshipType type;
        private String message;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static ResponseDto fromEntity(UserRelationship relationship) {
            return ResponseDto.builder()
                    .id(relationship.getId())
                    .requesterId(relationship.getRequester().getId())
                    .requesterName(relationship.getRequester().getName())
                    .requesterNickname(relationship.getRequester().getNickname())
                    .requesterPhone(relationship.getRequester().getPhone())
                    .receiverId(relationship.getReceiver().getId())
                    .receiverName(relationship.getReceiver().getName())
                    .receiverNickname(relationship.getReceiver().getNickname())
                    .receiverPhone(relationship.getReceiver().getPhone())
                    .status(relationship.getStatus())
                    .type(relationship.getType())
                    .message(relationship.getMessage())
                    .createdAt(relationship.getCreatedAt())
                    .updatedAt(relationship.getUpdatedAt())
                    .build();
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateStatusDto {
        private Long relationshipId;
        private UserRelationship.RelationshipStatus status; // ACCEPTED or REJECTED
    }
} 
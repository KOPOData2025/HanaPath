package com.hanapath.backend.users.dto;

import com.hanapath.backend.users.entity.User;
import com.hanapath.backend.users.entity.UserType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class UserResponseDto {
    private final Long id;
    private final String name;
    private final String nickname;
    private final String email;
    private final String phone;
    private final String nationalIdFront;
    private final String nationalIdBackFirst;
    private final UserType userType;
    private final Integer level;
    private final Integer totalExp;
    private final LocalDateTime createdAt;
    private final Boolean hasWallet;
    private final Boolean hasInvestmentAccount;
    private final Boolean hasParentRelation;

    public static UserResponseDto fromEntity(User user) {
        return new UserResponseDto(
                user.getId(),
                user.getName(),
                user.getNickname(),
                user.getEmail(),
                user.getPhone(),
                user.getNationalIdFront(),
                user.getNationalIdBackFirst(),
                user.getUserType(),
                user.getLevel(),
                user.getTotalExp(),
                user.getCreatedAt(),
                false, // hasWallet - 서비스에서 설정
                false, // hasInvestmentAccount - 서비스에서 설정
                false  // hasParentRelation - 서비스에서 설정
        );
    }

    public static UserResponseDto fromEntity(User user, boolean hasWallet, boolean hasInvestmentAccount, boolean hasParentRelation) {
        return new UserResponseDto(
                user.getId(),
                user.getName(),
                user.getNickname(),
                user.getEmail(),
                user.getPhone(),
                user.getNationalIdFront(),
                user.getNationalIdBackFirst(),
                user.getUserType(),
                user.getLevel(),
                user.getTotalExp(),
                user.getCreatedAt(),
                hasWallet,
                hasInvestmentAccount,
                hasParentRelation
        );
    }
}

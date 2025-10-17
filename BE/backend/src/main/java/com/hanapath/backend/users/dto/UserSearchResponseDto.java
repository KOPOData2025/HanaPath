package com.hanapath.backend.users.dto;

import com.hanapath.backend.users.entity.User;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class UserSearchResponseDto {
    private final Long id;
    private final String name;
    private final String phone;
    private final String accountNumber;

    public static UserSearchResponseDto fromEntity(User user, String accountNumber) {
        return new UserSearchResponseDto(
                user.getId(),
                user.getName(),
                user.getPhone(),
                accountNumber
        );
    }
} 
package com.hanapath.backend.users.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponseDto {
    private UserResponseDto user;
    private String token;
} 
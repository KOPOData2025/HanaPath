package com.hanapath.backend.users.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class UserLoginRequestDto {
    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String password;
}
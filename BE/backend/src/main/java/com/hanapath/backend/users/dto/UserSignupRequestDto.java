package com.hanapath.backend.users.dto;

import com.hanapath.backend.users.entity.UserType;
import jakarta.validation.constraints.*;
import lombok.Getter;

@Getter
public class UserSignupRequestDto {
    @NotNull
    private UserType userType;

    @NotBlank
    private String name;

    @Pattern(regexp = "\\d{6}")
    private String nationalIdFront;

    @Pattern(regexp = "\\d{1}")
    private String nationalIdBackFirst;

    @Email
    @NotBlank
    private String email;

    @Size(min = 6)
    private String password;

    @Pattern(regexp = "\\d{11}")
    private String phone;

    private boolean termsAgreed;
}

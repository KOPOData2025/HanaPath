package com.hanapath.backend.users.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 기본 PK

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserType userType; // teen or parent 구분

    @Column(nullable = false)
    private String name; // 사용자 이름

    @Column(unique = true, length = 20)
    private String nickname; // 닉네임 (중복 불가)

    @Column(nullable = false, length = 6)
    private String nationalIdFront; // 생년월일(YYMMDD)

    @Column(nullable = false, length = 1)
    private String nationalIdBackFirst; // 주민번호 뒷자리 첫 자리 (성별)

    @Column(nullable = false, unique = true, length = 100)
    private String email; // 이메일, 로그인 ID로 사용

    @Column(nullable = false)
    private String password; // BCrypt 암호화한 비밀번호

    @Column(nullable = false, unique = true, length = 20)
    private String phone; // 휴대폰 번호

    private boolean isPhoneVerified; // 문자 인증 여부 

    private boolean termsAgreed; // 약관 동의 여부

    @Column(nullable = false, columnDefinition = "int default 1")
    private Integer level; // 사용자 레벨 (1~5)

    @Column(nullable = false, name = "total_exp", columnDefinition = "int default 0")
    private Integer totalExp; // 누적 경험치

    @CreationTimestamp
    private LocalDateTime createdAt; // 생성 시간

    @UpdateTimestamp
    private LocalDateTime updatedAt; // 수정 시간

    @PrePersist
    public void prePersist() {
        if (level == null) {
            level = 1;
        }
        if (totalExp == null) {
            totalExp = 0;
        }
    }
}
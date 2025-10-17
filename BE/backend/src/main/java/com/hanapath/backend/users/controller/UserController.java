package com.hanapath.backend.users.controller;

import com.hanapath.backend.users.dto.*;
import com.hanapath.backend.users.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // 회원가입 요청
    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody @Valid UserSignupRequestDto dto) {
        userService.signup(dto);
        return ResponseEntity.ok("회원가입 성공");
    }

    // 로그인 요청
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody @Valid UserLoginRequestDto dto) {
        LoginResponseDto response = userService.login(dto);
        return ResponseEntity.ok(response);
    }

    // 이메일 중복 확인
    @GetMapping("/check-email")
    public ResponseEntity<Boolean> checkEmail(@RequestParam String email) {
        boolean isDuplicate = userService.checkEmailDuplicate(email);
        return ResponseEntity.ok(isDuplicate);
    }

    // 전화번호 중복 확인 
    @GetMapping("/check-phone")
    public ResponseEntity<Boolean> checkPhone(@RequestParam String phone) {
        boolean isDuplicate = userService.checkPhoneDuplicate(phone);
        return ResponseEntity.ok(isDuplicate);
    }

    // 닉네임 중복 확인
    @GetMapping("/check-nickname")
    public ResponseEntity<Boolean> checkNickname(@RequestParam String nickname) {
        boolean isDuplicate = userService.checkNicknameDuplicate(nickname);
        return ResponseEntity.ok(isDuplicate);
    }

    // 사용자 정보 조회
    @GetMapping("/{userId}")
    public ResponseEntity<UserResponseDto> getUserInfo(@PathVariable Long userId) {
        UserResponseDto user = userService.getUserInfo(userId);
        return ResponseEntity.ok(user);
    }

    // 사용자 정보 업데이트
    @PutMapping("/{userId}")
    public ResponseEntity<UserResponseDto> updateUser(@PathVariable Long userId, @RequestBody @Valid UserUpdateDto dto) {
        UserResponseDto user = userService.updateUser(userId, dto);
        return ResponseEntity.ok(user);
    }

    // 관계 요청 생성
    @PostMapping("/{userId}/relationships")
    public ResponseEntity<UserRelationshipDto.ResponseDto> createRelationship(
            @PathVariable Long userId,
            @RequestBody @Valid UserRelationshipDto.RequestDto dto) {
        UserRelationshipDto.ResponseDto relationship = userService.createRelationshipRequest(userId, dto);
        return ResponseEntity.ok(relationship);
    }

    // 받은 관계 요청 목록 조회
    @GetMapping("/{userId}/relationships/received")
    public ResponseEntity<List<UserRelationshipDto.ResponseDto>> getReceivedRequests(@PathVariable Long userId) {
        List<UserRelationshipDto.ResponseDto> requests = userService.getReceivedRequests(userId);
        return ResponseEntity.ok(requests);
    }

    // 보낸 관계 요청 목록 조회
    @GetMapping("/{userId}/relationships/sent")
    public ResponseEntity<List<UserRelationshipDto.ResponseDto>> getSentRequests(@PathVariable Long userId) {
        List<UserRelationshipDto.ResponseDto> requests = userService.getSentRequests(userId);
        return ResponseEntity.ok(requests);
    }

    // 모든 관계 조회
    @GetMapping("/{userId}/relationships")
    public ResponseEntity<List<UserRelationshipDto.ResponseDto>> getAllRelationships(@PathVariable Long userId) {
        List<UserRelationshipDto.ResponseDto> relationships = userService.getAllRelationships(userId);
        return ResponseEntity.ok(relationships);
    }

    // 관계 요청 상태 업데이트 (승인/거절)
    @PutMapping("/{userId}/relationships/status")
    public ResponseEntity<UserRelationshipDto.ResponseDto> updateRelationshipStatus(
            @PathVariable Long userId,
            @RequestBody @Valid UserRelationshipDto.UpdateStatusDto dto) {
        UserRelationshipDto.ResponseDto relationship = userService.updateRelationshipStatus(userId, dto);
        return ResponseEntity.ok(relationship);
    }

    // 관계 삭제
    @DeleteMapping("/{userId}/relationships/{relationshipId}")
    public ResponseEntity<String> deleteRelationship(@PathVariable Long userId, @PathVariable Long relationshipId) {
        userService.deleteRelationship(userId, relationshipId);
        return ResponseEntity.ok("관계가 삭제되었습니다.");
    }

    // 사용자 검색 (전화번호 또는 계좌번호로)
    @GetMapping("/search")
    public ResponseEntity<UserSearchResponseDto> searchUser(
            @RequestParam String type,
            @RequestParam String value) {
        UserSearchResponseDto user = userService.searchUser(type, value);
        return ResponseEntity.ok(user);
    }
}

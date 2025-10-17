package com.hanapath.backend.community.controller;

import com.hanapath.backend.community.dto.CommentDtos;
import com.hanapath.backend.community.dto.PollDtos;
import com.hanapath.backend.community.dto.PostDtos;
import com.hanapath.backend.community.service.CommunityService;
import com.hanapath.backend.users.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
@Slf4j
public class CommunityController {

    private final CommunityService communityService;
    private final JwtUtil jwtUtil;

    private Long getCurrentUserId(jakarta.servlet.http.HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalStateException("인증 토큰이 없습니다.");
        }

        String jwt = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(jwt);

        if (userId == null) {
            throw new IllegalStateException("사용자 ID를 추출할 수 없습니다.");
        }
        return userId;
    }

    @GetMapping("/posts")
    public ResponseEntity<Page<PostDtos.Response>> listPosts(
            @RequestParam(defaultValue = "all") String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        Long me = getCurrentUserId(request);
        return ResponseEntity.ok(communityService.listPosts(me, category, page, size));
    }

    @GetMapping("/posts/{postId}")
    public ResponseEntity<PostDtos.Response> getPost(
            @PathVariable Long postId,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        Long me = getCurrentUserId(request);
        return ResponseEntity.ok(communityService.getPost(me, postId));
    }

    @PostMapping("/posts")
    public ResponseEntity<PostDtos.Response> createPost(
            @RequestBody PostDtos.CreateRequest req,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        Long me = getCurrentUserId(request);
        return ResponseEntity.ok(communityService.createPost(me, req));
    }

    @PutMapping("/posts/{postId}")
    public ResponseEntity<PostDtos.Response> updatePost(
            @PathVariable Long postId,
            @RequestBody PostDtos.UpdateRequest req,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        Long me = getCurrentUserId(request);
        return ResponseEntity.ok(communityService.updatePost(me, postId, req));
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long postId,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        Long me = getCurrentUserId(request);
        communityService.deletePost(me, postId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<Boolean> toggleLike(
            @PathVariable Long postId,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        Long me = getCurrentUserId(request);
        boolean active = communityService.toggleLike(me, postId);
        return ResponseEntity.ok(active);
    }

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<CommentDtos.Response> addComment(
            @PathVariable Long postId,
            @RequestBody CommentDtos.CreateRequest req,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        Long me = getCurrentUserId(request);
        return ResponseEntity.ok(communityService.addComment(me, postId, req));
    }

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<java.util.List<CommentDtos.Response>> listComments(@PathVariable Long postId) {
        return ResponseEntity.ok(communityService.listComments(postId));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long commentId,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        Long me = getCurrentUserId(request);
        communityService.deleteComment(me, commentId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/posts/{postId}/poll")
    public ResponseEntity<PollDtos.Response> createOrUpdatePoll(
            @PathVariable Long postId,
            @RequestBody PollDtos.CreateRequest req,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        Long me = getCurrentUserId(request);
        return ResponseEntity.ok(communityService.createOrUpdatePoll(me, postId, req));
    }

    @GetMapping("/posts/{postId}/poll")
    public ResponseEntity<PollDtos.Response> getPoll(@PathVariable Long postId,
                                                     jakarta.servlet.http.HttpServletRequest request) {
        try {
            Long me = null;
            try {
                me = getCurrentUserId(request);
            } catch (Exception ignored) {
                
            }
            return ResponseEntity.ok(communityService.getPoll(postId, me));
        } catch (IllegalArgumentException e) {
            log.warn("투표 조회 실패: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("투표 조회 중 오류", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/posts/{postId}/poll/votes")
    public ResponseEntity<PollDtos.Response> vote(
            @PathVariable Long postId,
            @RequestBody PollDtos.VoteRequest req,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        try {
            Long me = getCurrentUserId(request);
            return ResponseEntity.ok(communityService.vote(me, postId, req.getOptionIds()));
        } catch (IllegalArgumentException e) {
            log.warn("투표 실패 (잘못된 요청): {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            log.warn("투표 실패 (상태 오류): {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("투표 처리 중 서버 오류", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}



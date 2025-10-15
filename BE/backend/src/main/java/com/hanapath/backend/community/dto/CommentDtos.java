package com.hanapath.backend.community.dto;

import com.hanapath.backend.community.entity.Comment;
import lombok.*;

import java.time.LocalDateTime;

public class CommentDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private String content;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long postId;
        private Long authorId;
        private String authorNickname;
        private String content;
        private LocalDateTime createdAt;

        public static Response from(Comment c) {
            return Response.builder()
                    .id(c.getId())
                    .postId(c.getPost().getId())
                    .authorId(c.getAuthor().getId())
                    .authorNickname(c.getAuthor().getNickname())
                    .content(c.getContent())
                    .createdAt(c.getCreatedAt())
                    .build();
        }
    }
}



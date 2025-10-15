package com.hanapath.backend.community.dto;

import com.hanapath.backend.community.entity.Post;
import com.hanapath.backend.community.entity.PostCategory;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class PostDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private String title;
        private String content;
        private PostCategory category;
        private List<String> tags;
        private String pollJson; 
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {
        private String title;
        private String content;
        private PostCategory category;
        private List<String> tags;
        private String pollJson; 
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private String title;
        private String content;
        private String authorNickname;
        private Long authorId;
        private Integer authorLevel;
        private PostCategory category;
        private List<String> tags;
        private int likeCount;
        private boolean likedByMe;
        private int commentCount;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private String pollJson;

        public static Response from(Post post, Long meUserId) {
            boolean likedByMe = post.getLikes().stream().anyMatch(l -> l.getUser().getId().equals(meUserId));
            return Response.builder()
                    .id(post.getId())
                    .title(post.getTitle())
                    .content(post.getContent())
                    .authorNickname(post.getAuthor().getNickname())
                    .authorId(post.getAuthor().getId())
                    .authorLevel(post.getAuthor().getLevel())
                    .category(post.getCategory())
                    .tags(post.getTags())
                    .likeCount(post.getLikes().size())
                    .likedByMe(likedByMe)
                    .commentCount(post.getComments().size())
                    .createdAt(post.getCreatedAt())
                    .updatedAt(post.getUpdatedAt())
                    .pollJson(post.getPollJson())
                    .build();
        }
    }
}



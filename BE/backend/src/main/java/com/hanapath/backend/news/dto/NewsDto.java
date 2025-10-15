package com.hanapath.backend.news.dto;

import com.hanapath.backend.news.model.NewsArticle;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NewsDto {
    private String id; 
    private String title;
    private String url;
    private String thumbnailUrl;
    private String source;
    private String publishedAt;
    private String category;
    private String summary;
    private String explanation;

    // 본문 
    private String contentText;
    private String contentHtml;
    
    // 적립 상태 
    private Boolean isRewarded;

    public static NewsDto fromEntity(NewsArticle entity) {
        return NewsDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .url(entity.getUrl())
                .thumbnailUrl(entity.getThumbnailUrl())
                .source(entity.getSource())
                .publishedAt(entity.getPublishedAt())
                .category(entity.getCategory())
                .summary(entity.getSummary())
                .explanation(entity.getExplanation())
                .contentText(entity.getContentText())
                .contentHtml(entity.getContentHtml())
                .isRewarded(false)
                .build();
    }
}
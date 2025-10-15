package com.hanapath.backend.news.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "breakingnews")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class NewsArticle {

    @Id
    private String id;
    private String category;
    private String url;
    private String title;

    @Field("content_html")
    private String contentHtml;

    @Field("content_text")
    private String contentText;

    private String source;

    @Field("published_at")
    private String publishedAt;

    @Field("thumbnail_url")
    private String thumbnailUrl;

    @Field("crawled_at")
    private String crawledAt;

    private String summary;       // 요약
    private String explanation;   // 쉬운 해설
}

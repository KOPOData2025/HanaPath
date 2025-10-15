package com.hanapath.backend.news.repository;

import com.hanapath.backend.news.model.NewsArticle;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NewsRepository extends MongoRepository<NewsArticle, String> {
    List<NewsArticle> findTop30ByOrderByPublishedAtDesc();

    List<NewsArticle> findTop10ByCategoryOrderByPublishedAtDesc(String category);

    Optional<NewsArticle> findFirstBySummaryIsNullOrderByPublishedAtDesc();

    List<NewsArticle> findAllBySummaryIsNullAndContentTextNotNull();
}
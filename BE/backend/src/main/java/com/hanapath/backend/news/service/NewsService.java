package com.hanapath.backend.news.service;

import com.hanapath.backend.news.dto.NewsDto;
import com.hanapath.backend.news.model.NewsArticle;
import com.hanapath.backend.news.repository.NewsRepository;
import com.hanapath.backend.news.service.gpt.GptClient;
import com.hanapath.backend.news.service.gpt.GptSummaryResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NewsService {

    private final NewsRepository newsRepository;
    private final GptClient gptClient;

    public Optional<NewsDto> getNewsById(String id) {
        return newsRepository.findById(id)
                .map(NewsDto::fromEntity);
    }

    public List<NewsDto> getRecentNews() {
        List<NewsDto> result = new ArrayList<>();
        List<String> categories = List.of("금융", "증권", "경제 일반");

        for (String category : categories) {
            List<NewsDto> categoryNews = newsRepository
                    .findTop10ByCategoryOrderByPublishedAtDesc(category)
                    .stream()
                    .map(NewsDto::fromEntity)
                    .collect(Collectors.toList());

            result.addAll(categoryNews);
        }

        return result;
    }

    // 한 건만 요약 (기존 방식)
    public void summarizeOnePendingNews() {
        List<NewsArticle> pending = newsRepository.findAllBySummaryIsNullAndContentTextNotNull();
        if (pending.isEmpty()) {
            log.info("요약할 뉴스 없음");
            return;
        }

        NewsArticle article = pending.get(0);
        log.info("요약 대상 뉴스: [{}] {}", article.getCategory(), article.getTitle());

        try {
            GptSummaryResponse response = gptClient.summarize(article.getContentText());
            article.setSummary(response.getSummary());
            article.setExplanation(response.getExplanation());
            newsRepository.save(article);

            log.info("뉴스 1건 요약 완료: {}", article.getTitle());
            log.info("요약 완료되었습니다!");

        } catch (Exception e) {
            log.error("뉴스 요약 실패: {}", article.getTitle(), e);
        }
    }

    // 여러 건 요약
    public void summarizeAllPendingNews() {
        List<NewsArticle> pendingArticles = newsRepository.findAllBySummaryIsNullAndContentTextNotNull();

        if (pendingArticles.isEmpty()) {
            log.info("요약할 뉴스 없음");
            return;
        }

        int successCount = 0;

        for (NewsArticle article : pendingArticles) {
            log.info("요약 대상 뉴스: [{}] {}", article.getCategory(), article.getTitle());
            try {
                GptSummaryResponse response = gptClient.summarize(article.getContentText());
                article.setSummary(response.getSummary());
                article.setExplanation(response.getExplanation());
                newsRepository.save(article);
                successCount++;
                Thread.sleep(1000); // OpenAI API 부하 방지용 딜레이
            } catch (Exception e) {
                log.error("뉴스 요약 실패: {}", article.getTitle(), e);
            }
        }

        log.info("총 {}건 뉴스 요약 완료", successCount);
    }
}
package com.hanapath.backend.news.scheduler;

import com.hanapath.backend.news.service.NewsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class NewsScheduler {

    private final NewsService newsService;
    
    @Value("${app.paths.python-venv}")
    private String pythonVenvPath;
    
    @Value("${app.paths.crawler-dir}")
    private String crawlerDirPath;

    @Scheduled(cron = "0 07 13 * * *", zone = "Asia/Seoul")
    public void runNewsCrawler() {
        log.info("뉴스 크롤링 스케줄러 실행");

        ProcessBuilder pb = new ProcessBuilder(
                pythonVenvPath,
                "news-crawler.py"
        );
        pb.directory(new File(crawlerDirPath));

        try {
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    log.info("[PYTHON STDOUT] {}", line);
                }
            }

            try (BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
                String line;
                while ((line = errorReader.readLine()) != null) {
                    log.error("[PYTHON STDERR] {}", line);
                }
            }

            int exitCode = process.waitFor();
            log.info("크롤링 종료. Exit code: {}", exitCode);

            try {
                // 새 뉴스 1개만 요약 (디버깅용)
//                 newsService.summarizeOnePendingNews();

                // 새 뉴스 전체 요약
                newsService.summarizeAllPendingNews();

            } catch (Exception e) {
                log.error("요약 처리 중 오류 발생", e);
            }

        } catch (IOException | InterruptedException e) {
            log.error("크롤링 중 오류 발생", e);
        }
    }
}
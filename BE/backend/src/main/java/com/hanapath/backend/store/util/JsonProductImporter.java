package com.hanapath.backend.store.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanapath.backend.store.entity.Product;
import com.hanapath.backend.store.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

/**
 * DB에 상품 삽입
 * 이미지 파일은 BASE_IMAGE_DIR 하위에서 재귀 탐색해 찾음
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JsonProductImporter implements CommandLineRunner {

    private final ProductRepository productRepository;

    @Value("${app.paths.json-products}")
    private String jsonPath;

    @Value("${app.paths.images-base-dir}")
    private String baseImageDir;

    @Override
    public void run(String... args) throws Exception {
        if (productRepository.count() > 0) {
            log.info("상품 데이터가 이미 존재하므로 초기화하지 않습니다.");
            return;
        }

        log.info("상품 JSON 로딩 시작...");

        ObjectMapper mapper = new ObjectMapper();
        List<Map<String, Object>> products = mapper.readValue(
                new File(jsonPath),
                new TypeReference<>() {}
        );

        for (Map<String, Object> p : products) {
            String name = (String) p.get("product");
            String brand = (String) p.get("brand");
            String category = (String) p.get("category");
            Integer price = toInteger(p.get("price"));
            Integer originalPrice = toInteger(p.get("original_price"));
            Double discountRate = toDouble(p.get("discount"));
            Integer validDays = toInteger(p.get("valid_days"));
            String description = (String) p.get("description");
            String imageFileName = extractFileName((String) p.get("image_file"));

            byte[] imageData = findImageData(baseImageDir, imageFileName);

            Product product = Product.builder()
                    .name(name)
                    .brand(brand)
                    .category(category)
                    .price(price)
                    .originalPrice(originalPrice)
                    .discount(discountRate != null ? discountRate.intValue() : null)
                    .validDays(validDays)
                    .description(description)
                    .vendor(brand)
                    .stock(100)
                    .isPopular(false)
                    .imageData(imageData)
                    .build();

            productRepository.save(product);
            log.info("상품 저장 완료: {}", name);
        }

        log.info("상품 데이터 삽입 완료 (총 {}건)", products.size());
    }

    // image_file 필드에서 파일명만 추출 
    private String extractFileName(String path) {
        if (path == null) return null;
        return Paths.get(path).getFileName().toString();
    }

    // 재귀 탐색하여 파일명과 일치하는 이미지 파일 찾기
    private byte[] findImageData(String baseDir, String targetFileName) {
        if (targetFileName == null) return null;
        try (Stream<Path> paths = Files.walk(Paths.get(baseDir))) {
            Path matchedPath = paths
                    .filter(Files::isRegularFile)
                    .filter(p -> p.getFileName().toString().equalsIgnoreCase(targetFileName))
                    .findFirst()
                    .orElse(null);

            if (matchedPath != null) {
                return Files.readAllBytes(matchedPath);
            } else {
                log.warn("이미지 파일을 찾지 못했습니다: {}", targetFileName);
            }
        } catch (IOException e) {
            log.error("이미지 파일 읽기 중 오류 발생: {}", targetFileName, e);
        }
        return null;
    }

    // Object → Integer 변환 안전 처리
    private Integer toInteger(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number) return ((Number) obj).intValue();
        try {
            return Integer.parseInt(obj.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    // Object → Double 변환 안전 처리
    private Double toDouble(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number) return ((Number) obj).doubleValue();
        try {
            return Double.parseDouble(obj.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}

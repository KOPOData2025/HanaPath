package com.hanapath.backend.store.repository;

import com.hanapath.backend.store.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    /**
     * 카테고리별 상품 조회
     * @param category 카테고리명 
     * @return 해당 카테고리의 상품 리스트
     */
    List<Product> findByCategory(String category);

    /**
     * 상품명 또는 브랜드로 키워드 검색
     * @param keword 검색어
     * @return 상품명 또는 브랜드에 키워드가 포함된 상품 리스트
     */
    List<Product> findByNameContainingIgnoreCaseOrBrandContainingIgnoreCase(String keyword1, String keyword2);
}

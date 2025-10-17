package com.hanapath.backend.community.repository;

import com.hanapath.backend.community.entity.Post;
import com.hanapath.backend.community.entity.PostCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {

    @EntityGraph(attributePaths = {"author", "likes", "comments"})
    Page<Post> findAllByCategory(PostCategory category, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"author", "likes", "comments"})
    Page<Post> findAll(Pageable pageable);
}



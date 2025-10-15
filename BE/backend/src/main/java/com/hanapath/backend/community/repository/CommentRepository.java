package com.hanapath.backend.community.repository;

import com.hanapath.backend.community.entity.Comment;
import com.hanapath.backend.community.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPost(Post post);
}



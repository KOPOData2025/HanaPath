package com.hanapath.backend.community.repository;

import com.hanapath.backend.community.entity.Post;
import com.hanapath.backend.community.entity.PostLike;
import com.hanapath.backend.users.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    boolean existsByPostAndUser(Post post, User user);
    Optional<PostLike> findByPostAndUser(Post post, User user);
    int countByPost(Post post);
}



package com.hanapath.backend.community.repository;

import com.hanapath.backend.community.entity.Poll;
import com.hanapath.backend.community.entity.Post;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PollRepository extends JpaRepository<Poll, Long> {

    @EntityGraph(attributePaths = {"options", "post"})
    Optional<Poll> findByPost(Post post);
}



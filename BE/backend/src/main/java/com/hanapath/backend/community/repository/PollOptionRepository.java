package com.hanapath.backend.community.repository;

import com.hanapath.backend.community.entity.Poll;
import com.hanapath.backend.community.entity.PollOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PollOptionRepository extends JpaRepository<PollOption, Long> {
    List<PollOption> findByPoll(Poll poll);
}



package com.hanapath.backend.community.repository;

import com.hanapath.backend.community.entity.Poll;
import com.hanapath.backend.community.entity.PollOption;
import com.hanapath.backend.community.entity.PollVote;
import com.hanapath.backend.users.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PollVoteRepository extends JpaRepository<PollVote, Long> {
    List<PollVote> findByPollAndUser(Poll poll, User user);
    Optional<PollVote> findByPollAndUserAndOption(Poll poll, User user, PollOption option);
    long countByPollAndOption(Poll poll, PollOption option);
}



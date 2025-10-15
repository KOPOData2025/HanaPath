package com.hanapath.backend.community.entity;

import com.hanapath.backend.users.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "community_poll_votes",
        uniqueConstraints = @UniqueConstraint(name = "uq_poll_user_option",
                columnNames = {"poll_id", "user_id", "option_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PollVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poll_id", nullable = false)
    private Poll poll;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "option_id", nullable = false)
    private PollOption option;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}



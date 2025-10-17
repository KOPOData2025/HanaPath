package com.hanapath.backend.community.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "community_polls")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Poll {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false, unique = true)
    private Post post;

    @Column(nullable = false, length = 200)
    private String question;

    @Column(nullable = false)
    private boolean allowMultiple;

    @Column(nullable = true)
    private LocalDateTime endsAt;

    @OneToMany(mappedBy = "poll", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PollOption> options = new ArrayList<>();
}



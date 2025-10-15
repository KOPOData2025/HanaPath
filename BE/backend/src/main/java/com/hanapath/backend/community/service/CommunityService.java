package com.hanapath.backend.community.service;

import com.hanapath.backend.community.dto.CommentDtos;
import com.hanapath.backend.community.dto.PostDtos;
import com.hanapath.backend.community.entity.Comment;
import com.hanapath.backend.community.entity.Poll;
import com.hanapath.backend.community.entity.PollOption;
import com.hanapath.backend.community.entity.PollVote;
import com.hanapath.backend.community.entity.Post;
import com.hanapath.backend.community.entity.PostCategory;
import com.hanapath.backend.community.entity.PostLike;
import com.hanapath.backend.community.repository.CommentRepository;
import com.hanapath.backend.community.repository.PostLikeRepository;
import com.hanapath.backend.community.repository.PollOptionRepository;
import com.hanapath.backend.community.repository.PollRepository;
import com.hanapath.backend.community.repository.PollVoteRepository;
import com.hanapath.backend.community.repository.PostRepository;
import com.hanapath.backend.users.entity.User;
import com.hanapath.backend.users.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import com.hanapath.backend.users.entity.ExperienceEvent;
import com.hanapath.backend.users.service.ExperienceService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CommunityService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final PostLikeRepository postLikeRepository;
    private final UserRepository userRepository;
    private final PollRepository pollRepository;
    private final PollOptionRepository pollOptionRepository;
    private final PollVoteRepository pollVoteRepository;
    private final ExperienceService experienceService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private User getUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    public Page<PostDtos.Response> listPosts(Long meUserId, String category, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Post> posts;
        if (category != null && !category.isBlank() && !category.equalsIgnoreCase("all")) {
            PostCategory pc = switch (category.toLowerCase()) {
                case "investment" -> PostCategory.INVESTMENT;
                case "education" -> PostCategory.EDUCATION;
                case "qna" -> PostCategory.QNA;
                default -> throw new IllegalArgumentException("잘못된 카테고리입니다.");
            };
            posts = postRepository.findAllByCategory(pc, pageable);
        } else {
            posts = postRepository.findAll(pageable);
        }
        return posts.map(p -> PostDtos.Response.from(p, meUserId));
    }

    public PostDtos.Response getPost(Long meUserId, Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        return PostDtos.Response.from(post, meUserId);
    }

    public java.util.List<CommentDtos.Response> listComments(Long postId) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        return commentRepository.findByPost(post).stream().map(CommentDtos.Response::from).toList();
    }

    @Transactional
    public PostDtos.Response createPost(Long userId, PostDtos.CreateRequest req) {
        User author = getUser(userId);
        Post post = Post.builder()
                .author(author)
                .title(req.getTitle())
                .content(req.getContent())
                .category(req.getCategory())
                .tags(req.getTags() == null ? java.util.List.of() : req.getTags())
                .pollJson(req.getPollJson())
                .build();
        Post saved = postRepository.save(post);
        // EXP: 커뮤니티 게시글 작성
        experienceService.awardExp(userId, ExperienceEvent.ExperienceType.COMMUNITY_POST, String.valueOf(saved.getId()));
        return PostDtos.Response.from(saved, userId);
    }

    @Transactional
    public PostDtos.Response updatePost(Long userId, Long postId, PostDtos.UpdateRequest req) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        if (!post.getAuthor().getId().equals(userId)) {
            throw new IllegalStateException("본인이 작성한 글만 수정할 수 있습니다.");
        }

        post.setTitle(req.getTitle());
        post.setContent(req.getContent());
        post.setCategory(req.getCategory());
        post.setTags(req.getTags() == null ? java.util.List.of() : req.getTags());
        post.setPollJson(req.getPollJson());
        return PostDtos.Response.from(post, userId);
    }

    @Transactional
    public void deletePost(Long userId, Long postId) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        if (!post.getAuthor().getId().equals(userId)) {
            throw new IllegalStateException("본인이 작성한 글만 삭제할 수 있습니다.");
        }
        postRepository.delete(post);
    }

    @Transactional
    public boolean toggleLike(Long userId, Long postId) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        User user = getUser(userId);
        return postLikeRepository.findByPostAndUser(post, user)
                .map(existing -> {
                    postLikeRepository.delete(existing); // 취소
                    return false;
                })
                .orElseGet(() -> {
                    PostLike like = PostLike.builder().post(post).user(user).build();
                    postLikeRepository.save(like);
                    return true;
                });
    }

    @Transactional
    public CommentDtos.Response addComment(Long userId, Long postId, CommentDtos.CreateRequest req) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        User author = getUser(userId);
        Comment comment = Comment.builder()
                .post(post)
                .author(author)
                .content(req.getContent())
                .build();
        Comment saved = commentRepository.save(comment);
        // EXP: 댓글 작성
        experienceService.awardExp(userId, ExperienceEvent.ExperienceType.COMMUNITY_COMMENT, String.valueOf(saved.getId()));
        return CommentDtos.Response.from(saved);
    }

    @Transactional
    public void deleteComment(Long userId, Long commentId) {
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        if (!comment.getAuthor().getId().equals(userId)) {
            throw new IllegalStateException("본인이 작성한 댓글만 삭제할 수 있습니다.");
        }
        commentRepository.delete(comment);
    }

    @Transactional
    public com.hanapath.backend.community.dto.PollDtos.Response createOrUpdatePoll(Long userId, Long postId, com.hanapath.backend.community.dto.PollDtos.CreateRequest req) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        if (!post.getAuthor().getId().equals(userId)) {
            throw new IllegalStateException("본인이 작성한 글에만 투표를 생성/수정할 수 있습니다.");
        }
        Poll poll = pollRepository.findByPost(post).orElseGet(() -> Poll.builder().post(post).build());
        poll.setQuestion(req.getQuestion());
        poll.setAllowMultiple(req.isAllowMultiple());
        poll.setEndsAt(req.getEndsAt());

        if (poll.getId() != null) {
            pollOptionRepository.deleteAll(poll.getOptions());
            poll.getOptions().clear();
        }
        Poll saved = pollRepository.save(poll);
        java.util.List<PollOption> opts = new java.util.ArrayList<>();
        for (String text : req.getOptions()) {
            PollOption option = PollOption.builder().poll(saved).text(text).build();
            opts.add(option);
        }
        pollOptionRepository.saveAll(opts);
        saved.setOptions(opts);
        return com.hanapath.backend.community.dto.PollDtos.Response.from(saved, (o) -> pollVoteRepository.countByPollAndOption(saved, o));
    }

    @Transactional
    public com.hanapath.backend.community.dto.PollDtos.Response getPoll(Long postId, Long meUserId) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        Poll poll = ensurePollExistsForPost(post);
        java.util.List<PollOption> myOptions;
        if (meUserId == null) {
            myOptions = java.util.List.of();
        } else {
            User me = getUser(meUserId);
            // 내 투표 목록 조회 후 옵션 ID만 추출
            java.util.List<PollVote> myVotes = pollVoteRepository.findByPollAndUser(poll, me);
            myOptions = myVotes.stream().map(PollVote::getOption).toList();
        }
        return com.hanapath.backend.community.dto.PollDtos.Response.from(
                poll,
                (o) -> pollVoteRepository.countByPollAndOption(poll, o),
                myOptions
        );
    }

    @Transactional
    public com.hanapath.backend.community.dto.PollDtos.Response vote(Long userId, Long postId, java.util.List<Long> optionIds) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        Poll poll = ensurePollExistsForPost(post);
        if (poll.getEndsAt() != null && poll.getEndsAt().isBefore(java.time.LocalDateTime.now())) {
            throw new IllegalStateException("마감된 투표입니다.");
        }
        if (optionIds == null || optionIds.isEmpty()) {
            throw new IllegalArgumentException("옵션을 선택하세요.");
        }
        // 중복 제거 후 단일 선택 검증
        java.util.Set<Long> uniqueOptionIds = new java.util.LinkedHashSet<>(optionIds);
        if (!poll.isAllowMultiple() && uniqueOptionIds.size() > 1) {
            throw new IllegalStateException("단일 선택만 가능합니다.");
        }
        User user = getUser(userId);
        java.util.List<PollOption> options = pollOptionRepository.findAllById(uniqueOptionIds);
        if (options.size() != uniqueOptionIds.size()) {
            throw new IllegalArgumentException("잘못된 옵션입니다.");
        }
        for (PollOption option : options) {
            if (!option.getPoll().getId().equals(poll.getId())) {
                throw new IllegalArgumentException("잘못된 옵션입니다.");
            }
        }
        // 사용자당 1회 제한: 기존 투표가 있으면 모두 삭제 후 새로 기록 (복수 허용일 때 여러개 기록)
        java.util.List<PollVote> existing = pollVoteRepository.findByPollAndUser(poll, user);
        if (!existing.isEmpty()) {
            pollVoteRepository.deleteAll(existing);
        }
        java.util.List<PollVote> votes = new java.util.ArrayList<>();
        for (PollOption option : options) {
            votes.add(PollVote.builder().poll(poll).option(option).user(user).build());
        }
        pollVoteRepository.saveAll(votes);
        // 방금 저장한 내 선택을 응답에도 포함
        java.util.List<PollOption> myOptions = votes.stream().map(PollVote::getOption).toList();
        return com.hanapath.backend.community.dto.PollDtos.Response.from(
                poll,
                (o) -> pollVoteRepository.countByPollAndOption(poll, o),
                myOptions
        );
    }

    private Poll ensurePollExistsForPost(Post post) {
        return pollRepository.findByPost(post).orElseGet(() -> {
            String json = post.getPollJson();
            if (json == null || json.isBlank()) {
                throw new IllegalArgumentException("투표가 없습니다.");
            }
            try {
                JsonNode root = objectMapper.readTree(json);
                String question = root.path("question").asText(null);
                if (question == null || question.isBlank()) {
                    throw new IllegalArgumentException("투표 데이터가 올바르지 않습니다.");
                }
                boolean allowMultiple = root.path("allowMultiple").asBoolean(false);
                java.time.LocalDateTime endsAt = null;
                JsonNode endsNode = root.get("endsAt");
                if (endsNode != null && !endsNode.isNull()) {
                    String endsText = endsNode.asText();
                    endsAt = parseEndsAt(endsText);
                }

                Poll poll = Poll.builder()
                        .post(post)
                        .question(question)
                        .allowMultiple(allowMultiple)
                        .endsAt(endsAt)
                        .build();
                Poll saved = pollRepository.save(poll);

                java.util.List<PollOption> optionEntities = new java.util.ArrayList<>();
                JsonNode optionsNode = root.get("options");
                if (optionsNode != null && optionsNode.isArray()) {
                    for (JsonNode opt : optionsNode) {
                        String text;
                        if (opt.isTextual()) {
                            text = opt.asText();
                        } else {
                            text = opt.path("text").asText(null);
                        }
                        if (text != null && !text.isBlank()) {
                            optionEntities.add(PollOption.builder().poll(saved).text(text).build());
                        }
                    }
                }
                if (!optionEntities.isEmpty()) {
                    pollOptionRepository.saveAll(optionEntities);
                    saved.setOptions(optionEntities);
                }
                return saved;
            } catch (IllegalArgumentException e) {
                throw e;
            } catch (Exception e) {
                throw new IllegalArgumentException("투표 데이터를 불러올 수 없습니다.");
            }
        });
    }

    private java.time.LocalDateTime parseEndsAt(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return java.time.LocalDateTime.parse(value);
        } catch (Exception ignored) {
        }
        try {
            java.time.Instant instant = java.time.Instant.parse(value);
            return java.time.LocalDateTime.ofInstant(instant, java.time.ZoneId.systemDefault());
        } catch (Exception ignored) {
        }
        return null;
    }
}



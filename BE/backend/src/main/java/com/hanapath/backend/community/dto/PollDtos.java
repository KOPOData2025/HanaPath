package com.hanapath.backend.community.dto;

import com.hanapath.backend.community.entity.Poll;
import com.hanapath.backend.community.entity.PollOption;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class PollDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private String question;
        private boolean allowMultiple;
        private LocalDateTime endsAt;
        private List<String> options;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VoteRequest {
        private List<Long> optionIds;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OptionResponse {
        private Long id;
        private String text;
        private long votes;

        public static OptionResponse from(PollOption option, long votes) {
            return OptionResponse.builder()
                    .id(option.getId())
                    .text(option.getText())
                    .votes(votes)
                    .build();
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long postId;
        private String question;
        private boolean allowMultiple;
        private LocalDateTime endsAt;
        private List<OptionResponse> options;
        private List<Long> myOptionIds;

        public static Response from(Poll poll, java.util.function.Function<PollOption, Long> countFn) {
            return Response.builder()
                    .id(poll.getId())
                    .postId(poll.getPost().getId())
                    .question(poll.getQuestion())
                    .allowMultiple(poll.isAllowMultiple())
                    .endsAt(poll.getEndsAt())
                    .options(poll.getOptions().stream()
                            .map(o -> OptionResponse.from(o, countFn.apply(o)))
                            .toList())
                    .myOptionIds(java.util.List.of())
                    .build();
        }

        public static Response from(Poll poll,
                                     java.util.function.Function<PollOption, Long> countFn,
                                     java.util.Collection<PollOption> myOptions) {
            List<Long> mine = (myOptions == null)
                    ? java.util.List.of()
                    : myOptions.stream().map(PollOption::getId).toList();
            Response resp = from(poll, countFn);
            resp.setMyOptionIds(mine);
            return resp;
        }
    }
}



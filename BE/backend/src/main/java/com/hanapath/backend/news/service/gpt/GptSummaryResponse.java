package com.hanapath.backend.news.service.gpt;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GptSummaryResponse {
    private String summary;
    private String explanation;
}

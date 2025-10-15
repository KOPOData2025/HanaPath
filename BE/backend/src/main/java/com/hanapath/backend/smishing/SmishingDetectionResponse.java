package com.hanapath.backend.smishing;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SmishingDetectionResponse {
    @JsonProperty("isSmishing")
    private boolean isSmishing;
    private double confidence;
    private List<String> reasons;
    private List<String> suggestions;
    private String error;
}

package com.studytube.modules.progress.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request to record a watch event — sent by frontend as user watches a video.
 */
@Data
public class RecordWatchRequest {

    @NotBlank(message = "Video ID is required")
    private String videoId;

    @Min(value = 0, message = "Watch duration cannot be negative")
    private Long watchDurationSeconds;

    @Min(value = 0, message = "Completion percent must be 0-100")
    @Max(value = 100, message = "Completion percent must be 0-100")
    private Integer completionPercent;
}

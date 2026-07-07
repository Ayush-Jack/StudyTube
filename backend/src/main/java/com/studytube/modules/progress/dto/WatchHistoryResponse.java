package com.studytube.modules.progress.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Watch history item — returned in the history list.
 */
@Data
@Builder
public class WatchHistoryResponse {
    private String id;
    private String videoId;
    private String youtubeVideoId;
    private String videoTitle;
    private String channelName;
    private String thumbnailUrl;
    private String domain;
    private LocalDateTime watchedAt;
    private Long watchDurationSeconds;
    private Integer completionPercent;
    private boolean isCompleted;
}

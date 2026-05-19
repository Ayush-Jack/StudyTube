package com.studytube.modules.video.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

/**
 * Video response — returned in feed, search, and detail views.
 */
@Data
@Builder
public class VideoResponse {
    private String id;
    private String youtubeVideoId;
    private String channelId;
    private String channelName;
    private String channelAvatar;
    private String title;
    private String description;
    private String thumbnailUrl;
    private String duration;
    private long viewCount;
    private String viewCountDisplay;
    private String domain;
    private Instant publishedAt;
}

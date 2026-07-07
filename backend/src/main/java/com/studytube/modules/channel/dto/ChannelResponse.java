package com.studytube.modules.channel.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

/**
 * Channel response — public-facing channel info.
 */
@Data
@Builder
public class ChannelResponse {
    private String id;
    private String youtubeChannelId;
    private String name;
    private String handle;
    private String description;
    private String thumbnailUrl;
    private String subscriberCount;
    private List<String> domains;
    private boolean approved;
    private Instant createdAt;
}

package com.studytube.modules.video.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * YouTube video metadata — synced from approved channels.
 * Playback happens via YouTube iframe embed on the frontend.
 */
@Document(collection = "videos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Video {

    @Id
    private String id;

    @Indexed(unique = true)
    private String youtubeVideoId;

    @Indexed
    private String channelId;           // our Channel document id

    private String youtubeChannelId;    // original YouTube channel id
    private String channelName;         // denormalized for fast reads
    private String channelAvatar;       // denormalized

    private String title;
    private String description;
    private String thumbnailUrl;

    private String duration;            // ISO 8601 → formatted e.g. "45:23"
    private long viewCount;
    private String viewCountDisplay;    // e.g. "1.2M"

    @Indexed
    private String domain;              // single primary domain for this video

    private Instant publishedAt;

    @Builder.Default
    private boolean synced = true;

    @CreatedDate
    private Instant createdAt;
}

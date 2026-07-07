package com.studytube.modules.progress.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Watch history entry — one per userId+videoId pair.
 * Updated in place when the same user re-watches the same video.
 */
@Document(collection = "watch_history")
@CompoundIndex(name = "user_video_idx", def = "{'userId': 1, 'videoId': 1}", unique = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WatchHistory {

    @Id
    private String id;

    private String userId;
    private String videoId;
    private String youtubeVideoId;
    private String videoTitle;
    private String channelName;
    private String thumbnailUrl;
    private String domain;

    private LocalDateTime watchedAt;

    @Builder.Default
    private Long watchDurationSeconds = 0L;

    @Builder.Default
    private Integer completionPercent = 0;

    @Builder.Default
    private boolean isCompleted = false;
}

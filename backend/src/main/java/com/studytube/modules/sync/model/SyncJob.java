package com.studytube.modules.sync.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Persistent sync job — tracks the lifecycle and progress of a full sync run.
 * Stored in MongoDB so progress survives server restarts and can be queried
 * by the frontend for live polling.
 */
@Document(collection = "sync_jobs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncJob {

    @Id
    private String id;

    @Builder.Default
    private SyncJobStatus status = SyncJobStatus.QUEUED;

    private Instant startedAt;
    private Instant completedAt;

    @Builder.Default
    private int totalChannels = 0;

    @Builder.Default
    private int processedChannels = 0;

    @Builder.Default
    private int totalVideosFound = 0;

    @Builder.Default
    private int totalVideosAdded = 0;

    private String currentChannel;
    private String errorMessage;

    @Builder.Default
    private int progressPercentage = 0;

    private Long durationMs;

    @Builder.Default
    private List<ChannelSyncResult> channelResults = new ArrayList<>();

    // ── Embedded per-channel result ──────────────────────────────
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChannelSyncResult {
        private String channelId;
        private String channelName;
        private String status;       // SUCCESS / FAILED / PARTIAL
        private int videosFound;
        private int videosAdded;
        private int videosSkipped;
        private String errorMessage;
        private Long durationMs;
    }
}

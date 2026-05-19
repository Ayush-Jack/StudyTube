package com.studytube.modules.sync.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Sync log entry — one per channel per sync run.
 * Tracks results for auditing and admin dashboard.
 */
@Document(collection = "sync_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncLog {

    @Id
    private String id;

    private String channelId;
    private String channelName;

    @Builder.Default
    private SyncStatus status = SyncStatus.SUCCESS;

    @Builder.Default
    private int videosFound = 0;

    @Builder.Default
    private int videosAdded = 0;

    @Builder.Default
    private int videosSkipped = 0;

    private String errorMessage;

    private LocalDateTime syncedAt;

    private Long durationMs;
}

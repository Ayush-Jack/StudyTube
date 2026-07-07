package com.studytube.modules.sync.dto;

import com.studytube.modules.sync.model.SyncStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Sync result — returned after syncing a channel.
 */
@Data
@Builder
public class SyncResultResponse {
    private String channelId;
    private String channelName;
    private SyncStatus status;
    private int videosFound;
    private int videosAdded;
    private int videosSkipped;
    private String errorMessage;
    private LocalDateTime syncedAt;
    private Long durationMs;
}

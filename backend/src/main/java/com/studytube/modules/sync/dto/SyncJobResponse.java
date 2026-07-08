package com.studytube.modules.sync.dto;

import com.studytube.modules.sync.model.SyncJob;
import com.studytube.modules.sync.model.SyncJobStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

/**
 * DTO returned by the sync status and history endpoints.
 * Maps from {@link SyncJob} entity.
 */
@Data
@Builder
public class SyncJobResponse {

    private String jobId;
    private SyncJobStatus status;
    private int progress;
    private String currentChannel;
    private int processedChannels;
    private int totalChannels;
    private int totalVideosFound;
    private int totalVideosAdded;
    private Instant startedAt;
    private Instant completedAt;
    private Long durationMs;
    private String errorMessage;
    private List<SyncJob.ChannelSyncResult> channelResults;

    // ── Factory: map entity → DTO ────────────────────────────────
    public static SyncJobResponse from(SyncJob job) {
        return SyncJobResponse.builder()
                .jobId(job.getId())
                .status(job.getStatus())
                .progress(job.getProgressPercentage())
                .currentChannel(job.getCurrentChannel())
                .processedChannels(job.getProcessedChannels())
                .totalChannels(job.getTotalChannels())
                .totalVideosFound(job.getTotalVideosFound())
                .totalVideosAdded(job.getTotalVideosAdded())
                .startedAt(job.getStartedAt())
                .completedAt(job.getCompletedAt())
                .durationMs(job.getDurationMs())
                .errorMessage(job.getErrorMessage())
                .channelResults(job.getChannelResults())
                .build();
    }
}

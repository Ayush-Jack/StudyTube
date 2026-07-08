package com.studytube.modules.sync.controller;

import com.studytube.common.response.ApiResponse;
import com.studytube.common.util.AppConstants;
import com.studytube.modules.sync.dto.SyncJobResponse;
import com.studytube.modules.sync.dto.SyncResultResponse;
import com.studytube.modules.sync.model.SyncLog;
import com.studytube.modules.sync.repository.SyncLogRepository;
import com.studytube.modules.sync.service.SyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Sync controller — admin-only endpoints to trigger and monitor YouTube sync.
 * All endpoints require ADMIN role.
 *
 * <h3>Async (recommended)</h3>
 * <ul>
 *   <li>{@code POST /start} — fire-and-forget, returns jobId immediately</li>
 *   <li>{@code GET /status/{jobId}} — poll progress every 2 seconds</li>
 *   <li>{@code GET /jobs} — paginated job history</li>
 * </ul>
 *
 * <h3>Legacy (blocking)</h3>
 * <ul>
 *   <li>{@code POST /trigger} — waits until sync completes</li>
 *   <li>{@code POST /channel/{channelId}} — sync single channel</li>
 * </ul>
 */
@RestController
@RequestMapping(AppConstants.Api.ADMIN + "/sync")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class SyncController {

    private final SyncService syncService;
    private final SyncLogRepository syncLogRepository;

    // ════════════════════════════════════════════════════════════════
    //  ASYNC ENDPOINTS (new)
    // ════════════════════════════════════════════════════════════════

    /**
     * Start a background sync job.
     * Returns immediately with HTTP 202 and the jobId.
     * Frontend should poll /status/{jobId} every 2 seconds.
     */
    @PostMapping("/start")
    public ResponseEntity<ApiResponse<Map<String, String>>> startAsyncSync() {
        String jobId = syncService.startAsyncSync();
        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(ApiResponse.<Map<String, String>>builder()
                        .success(true)
                        .message("Sync started successfully")
                        .data(Map.of("jobId", jobId))
                        .status(HttpStatus.ACCEPTED.value())
                        .build());
    }

    /**
     * Poll the progress of a sync job.
     * Returns current status, progress %, current channel, video counts.
     */
    @GetMapping("/status/{jobId}")
    public ResponseEntity<ApiResponse<SyncJobResponse>> getJobStatus(
            @PathVariable String jobId
    ) {
        SyncJobResponse status = syncService.getJobStatus(jobId);
        return ResponseEntity.ok(ApiResponse.ok(status));
    }

    /**
     * Get paginated history of all sync jobs.
     */
    @GetMapping("/jobs")
    public ResponseEntity<ApiResponse<Page<SyncJobResponse>>> getJobHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<SyncJobResponse> jobs = syncService.getJobHistory(page, size);
        return ResponseEntity.ok(ApiResponse.ok(jobs));
    }

    // ════════════════════════════════════════════════════════════════
    //  LEGACY ENDPOINTS (preserved — backward compatible)
    // ════════════════════════════════════════════════════════════════

    /** POST /trigger — sync all channels (blocking). */
    @PostMapping("/trigger")
    public ResponseEntity<ApiResponse<List<SyncResultResponse>>> triggerSyncAll() {
        List<SyncResultResponse> results = syncService.syncAllChannels();
        return ResponseEntity.ok(ApiResponse.ok("Sync completed", results));
    }

    /** POST /channel/{channelId} — sync single channel (blocking). */
    @PostMapping("/channel/{channelId}")
    public ResponseEntity<ApiResponse<SyncResultResponse>> triggerSyncChannel(
            @PathVariable String channelId
    ) {
        SyncResultResponse result = syncService.syncChannelById(channelId);
        return ResponseEntity.ok(ApiResponse.ok("Channel synced", result));
    }

    // ════════════════════════════════════════════════════════════════
    //  SYNC LOG ENDPOINTS (preserved)
    // ════════════════════════════════════════════════════════════════

    /** GET /logs — all sync logs (per-channel history). */
    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<Page<SyncLog>>> getAllLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<SyncLog> logs = syncLogRepository.findAllByOrderBySyncedAtDesc(
                PageRequest.of(page, Math.min(size, 100))
        );
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }

    /** GET /logs/{channelId} — channel-specific sync logs. */
    @GetMapping("/logs/{channelId}")
    public ResponseEntity<ApiResponse<Page<SyncLog>>> getChannelLogs(
            @PathVariable String channelId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<SyncLog> logs = syncLogRepository.findByChannelIdOrderBySyncedAtDesc(
                channelId, PageRequest.of(page, Math.min(size, 100))
        );
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }
}

package com.studytube.modules.sync.controller;

import com.studytube.common.response.ApiResponse;
import com.studytube.common.util.AppConstants;
import com.studytube.modules.sync.dto.SyncResultResponse;
import com.studytube.modules.sync.model.SyncLog;
import com.studytube.modules.sync.repository.SyncLogRepository;
import com.studytube.modules.sync.service.SyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Sync controller — admin-only endpoints to trigger and monitor YouTube sync.
 * All endpoints require ADMIN role.
 */
@RestController
@RequestMapping(AppConstants.Api.ADMIN + "/sync")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class SyncController {

    private final SyncService syncService;
    private final SyncLogRepository syncLogRepository;

    // ── POST /api/v1/admin/sync/trigger — sync all channels ────
    @PostMapping("/trigger")
    public ResponseEntity<ApiResponse<List<SyncResultResponse>>> triggerSyncAll() {
        List<SyncResultResponse> results = syncService.syncAllChannels();
        return ResponseEntity.ok(ApiResponse.ok("Sync completed", results));
    }

    // ── POST /api/v1/admin/sync/channel/{channelId} — sync one ─
    @PostMapping("/channel/{channelId}")
    public ResponseEntity<ApiResponse<SyncResultResponse>> triggerSyncChannel(
            @PathVariable String channelId
    ) {
        SyncResultResponse result = syncService.syncChannelById(channelId);
        return ResponseEntity.ok(ApiResponse.ok("Channel synced", result));
    }

    // ── GET /api/v1/admin/sync/logs — all sync logs ─────────────
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

    // ── GET /api/v1/admin/sync/logs/{channelId} — channel logs ──
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

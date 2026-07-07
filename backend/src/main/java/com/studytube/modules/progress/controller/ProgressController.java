package com.studytube.modules.progress.controller;

import com.studytube.common.response.ApiResponse;
import com.studytube.common.util.AppConstants;
import com.studytube.modules.auth.model.User;
import com.studytube.modules.progress.dto.RecordWatchRequest;
import com.studytube.modules.progress.dto.UserStatsResponse;
import com.studytube.modules.progress.dto.WatchHistoryResponse;
import com.studytube.modules.progress.service.ProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * Progress controller — watch tracking and learning stats.
 * All endpoints require JWT authentication.
 * Base path: /api/v1/progress
 */
@RestController
@RequestMapping(AppConstants.Api.PROGRESS)
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    // ── POST /api/v1/progress/watch — record watch event ────────
    @PostMapping("/watch")
    public ResponseEntity<ApiResponse<WatchHistoryResponse>> recordWatch(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody RecordWatchRequest request
    ) {
        WatchHistoryResponse response = progressService.recordWatch(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Watch recorded", response));
    }

    // ── GET /api/v1/progress/history — paginated history ────────
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<Page<WatchHistoryResponse>>> getHistory(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<WatchHistoryResponse> history = progressService.getWatchHistory(user.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }

    // ── GET /api/v1/progress/video/{videoId} — single video progress
    @GetMapping("/video/{videoId}")
    public ResponseEntity<ApiResponse<WatchHistoryResponse>> getVideoProgress(
            @AuthenticationPrincipal User user,
            @PathVariable String videoId
    ) {
        Optional<WatchHistoryResponse> progress = progressService.getVideoProgress(user.getId(), videoId);
        return progress
                .map(p -> ResponseEntity.ok(ApiResponse.ok(p)))
                .orElse(ResponseEntity.ok(ApiResponse.ok("No progress yet", null)));
    }

    // ── GET /api/v1/progress/stats — learning dashboard stats ───
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<UserStatsResponse>> getStats(
            @AuthenticationPrincipal User user
    ) {
        UserStatsResponse stats = progressService.getUserStats(user.getId());
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    // ── DELETE /api/v1/progress/history/{id} — remove single entry ──
    @DeleteMapping("/history/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHistoryEntry(
            @AuthenticationPrincipal User user,
            @PathVariable String id
    ) {
        progressService.deleteHistoryEntry(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok("History entry removed", null));
    }

    // ── DELETE /api/v1/progress/history — clear all history ─────────
    @DeleteMapping("/history")
    public ResponseEntity<ApiResponse<Void>> clearAllHistory(
            @AuthenticationPrincipal User user
    ) {
        progressService.clearAllHistory(user.getId());
        return ResponseEntity.ok(ApiResponse.ok("All history cleared", null));
    }
}

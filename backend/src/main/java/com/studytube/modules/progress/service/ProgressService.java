package com.studytube.modules.progress.service;

import com.studytube.common.exception.AppException;
import com.studytube.modules.progress.dto.RecordWatchRequest;
import com.studytube.modules.progress.dto.UserStatsResponse;
import com.studytube.modules.progress.dto.WatchHistoryResponse;
import com.studytube.modules.progress.model.WatchHistory;
import com.studytube.modules.progress.repository.WatchHistoryRepository;
import com.studytube.modules.video.model.Video;
import com.studytube.modules.video.repository.VideoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Progress service — record watches, query history, compute stats.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProgressService {

    private final WatchHistoryRepository watchHistoryRepository;
    private final VideoRepository videoRepository;

    // ── Record or update a watch event ──────────────────────────
    public WatchHistoryResponse recordWatch(String userId, RecordWatchRequest request) {
        // Fetch video to get metadata
        Video video = videoRepository.findById(request.getVideoId())
                .orElseThrow(() -> AppException.notFound("Video not found"));

        int percent = request.getCompletionPercent() != null ? request.getCompletionPercent() : 0;
        long duration = request.getWatchDurationSeconds() != null ? request.getWatchDurationSeconds() : 0;

        // Upsert: find existing or create new
        WatchHistory history = watchHistoryRepository
                .findByUserIdAndVideoId(userId, video.getId())
                .orElse(null);

        if (history != null) {
            // UPDATE — keep the higher completion and accumulate duration
            history.setWatchDurationSeconds(
                    Math.max(history.getWatchDurationSeconds(), duration)
            );
            history.setCompletionPercent(
                    Math.max(history.getCompletionPercent(), percent)
            );
            history.setCompleted(history.getCompletionPercent() >= 90);
            history.setWatchedAt(LocalDateTime.now());
        } else {
            // CREATE
            history = WatchHistory.builder()
                    .userId(userId)
                    .videoId(video.getId())
                    .youtubeVideoId(video.getYoutubeVideoId())
                    .videoTitle(video.getTitle())
                    .channelName(video.getChannelName())
                    .thumbnailUrl(video.getThumbnailUrl())
                    .domain(video.getDomain())
                    .watchDurationSeconds(duration)
                    .completionPercent(percent)
                    .isCompleted(percent >= 90)
                    .watchedAt(LocalDateTime.now())
                    .build();
        }

        history = watchHistoryRepository.save(history);
        log.debug("Watch recorded: user={} video={} percent={}%", userId, video.getTitle(), percent);
        return toResponse(history);
    }

    // ── Get paginated watch history ─────────────────────────────
    public Page<WatchHistoryResponse> getWatchHistory(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 50));
        return watchHistoryRepository.findByUserIdOrderByWatchedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    // ── Get progress for a specific video ───────────────────────
    public Optional<WatchHistoryResponse> getVideoProgress(String userId, String videoId) {
        return watchHistoryRepository.findByUserIdAndVideoId(userId, videoId)
                .map(this::toResponse);
    }

    // ── Delete a single history entry ───────────────────────────
    public void deleteHistoryEntry(String userId, String historyId) {
        WatchHistory entry = watchHistoryRepository.findById(historyId)
                .orElseThrow(() -> AppException.notFound("History entry not found"));
        if (!entry.getUserId().equals(userId)) {
            throw AppException.forbidden("Not your history entry");
        }
        watchHistoryRepository.deleteById(historyId);
        log.debug("Deleted history entry: {} for user {}", historyId, userId);
    }

    // ── Clear all history for a user ────────────────────────────
    public void clearAllHistory(String userId) {
        List<WatchHistory> all = watchHistoryRepository.findByUserId(userId);
        watchHistoryRepository.deleteAll(all);
        log.info("Cleared {} history entries for user {}", all.size(), userId);
    }

    // ── Get user learning stats ─────────────────────────────────
    public UserStatsResponse getUserStats(String userId) {
        long totalWatched = watchHistoryRepository.countByUserId(userId);
        long totalCompleted = watchHistoryRepository.countByUserIdAndIsCompleted(userId, true);

        // Total watch time via aggregation
        long totalSeconds = 0;
        List<WatchHistoryRepository.TotalWatchTime> result =
                watchHistoryRepository.sumWatchDurationByUserId(userId);
        if (!result.isEmpty() && result.get(0).getTotal() != null) {
            totalSeconds = result.get(0).getTotal();
        }

        // Domains studied + most watched domain
        List<WatchHistory> allHistory = watchHistoryRepository.findByUserId(userId);

        List<String> domainsStudied = allHistory.stream()
                .map(WatchHistory::getDomain)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .toList();

        String mostWatchedDomain = allHistory.stream()
                .map(WatchHistory::getDomain)
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(d -> d, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        return UserStatsResponse.builder()
                .totalVideosWatched(totalWatched)
                .totalVideosCompleted(totalCompleted)
                .totalWatchTimeSeconds(totalSeconds)
                .totalWatchTimeFormatted(formatDuration(totalSeconds))
                .domainsStudied(domainsStudied)
                .mostWatchedDomain(mostWatchedDomain)
                .build();
    }

    // ── Format seconds → "Xh Ym" ───────────────────────────────
    private String formatDuration(long totalSeconds) {
        long hours = totalSeconds / 3600;
        long minutes = (totalSeconds % 3600) / 60;
        if (hours > 0) {
            return hours + "h " + minutes + "m";
        }
        return minutes + "m";
    }

    // ── Mapper ──────────────────────────────────────────────────
    private WatchHistoryResponse toResponse(WatchHistory h) {
        return WatchHistoryResponse.builder()
                .id(h.getId())
                .videoId(h.getVideoId())
                .youtubeVideoId(h.getYoutubeVideoId())
                .videoTitle(h.getVideoTitle())
                .channelName(h.getChannelName())
                .thumbnailUrl(h.getThumbnailUrl())
                .domain(h.getDomain())
                .watchedAt(h.getWatchedAt())
                .watchDurationSeconds(h.getWatchDurationSeconds())
                .completionPercent(h.getCompletionPercent())
                .isCompleted(h.isCompleted())
                .build();
    }
}

package com.studytube.modules.sync.service;

import com.studytube.common.exception.AppException;
import com.studytube.modules.channel.model.Channel;
import com.studytube.modules.channel.repository.ChannelRepository;
import com.studytube.modules.sync.dto.SyncJobResponse;
import com.studytube.modules.sync.dto.SyncResultResponse;
import com.studytube.modules.sync.model.*;
import com.studytube.modules.sync.repository.SyncJobRepository;
import com.studytube.modules.sync.repository.SyncLogRepository;
import com.studytube.modules.video.model.Video;
import com.studytube.modules.video.repository.VideoRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.RejectedExecutionException;

/**
 * Sync service — orchestrates YouTube → MongoDB video syncing.
 *
 * <p>Supports two modes:</p>
 * <ul>
 *   <li><b>Async (production)</b> — {@link #startAsyncSync()} creates a SyncJob,
 *       returns the jobId immediately, and runs the sync in background via {@code @Async}.</li>
 *   <li><b>Blocking (legacy/scheduled)</b> — {@link #syncAllChannels()} runs synchronously
 *       for scheduled cron jobs and backward-compatible trigger endpoint.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SyncService {

    private final ChannelRepository channelRepository;
    private final VideoRepository videoRepository;
    private final SyncLogRepository syncLogRepository;
    private final SyncJobRepository syncJobRepository;
    private final YouTubeApiService youTubeApiService;

    /**
     * Max videos to fetch per channel per sync.
     * Configurable via application.yaml: app.sync.max-videos-per-channel
     *
     * Convention: -1 = Unlimited (fetch ALL), any positive value = limit.
     * Defaults to -1 (unlimited) if not set.
     */
    @Value("${app.sync.max-videos-per-channel:-1}")
    private int maxVideosPerChannel;

    // ════════════════════════════════════════════════════════════════
    //  STARTUP RECOVERY — mark stale jobs as FAILED
    // ════════════════════════════════════════════════════════════════

    @PostConstruct
    public void recoverStaleJobs() {
        List<SyncJob> staleJobs = syncJobRepository.findByStatusIn(
                List.of(SyncJobStatus.QUEUED, SyncJobStatus.RUNNING)
        );
        if (!staleJobs.isEmpty()) {
            log.warn("Found {} stale sync jobs from previous run — marking as FAILED", staleJobs.size());
            for (SyncJob job : staleJobs) {
                job.setStatus(SyncJobStatus.FAILED);
                job.setErrorMessage("Server restarted during sync");
                job.setCompletedAt(Instant.now());
                if (job.getStartedAt() != null) {
                    job.setDurationMs(Instant.now().toEpochMilli() - job.getStartedAt().toEpochMilli());
                }
                syncJobRepository.save(job);
            }
        }
    }

    // ════════════════════════════════════════════════════════════════
    //  ASYNC MODE — fire-and-forget with progress tracking
    // ════════════════════════════════════════════════════════════════

    /**
     * Start a new async sync job.
     * Creates a SyncJob in QUEUED state, submits it to the background executor,
     * and returns the jobId immediately.
     *
     * @return jobId for polling via {@link #getJobStatus(String)}
     * @throws AppException if a sync is already running/queued
     */
    public String startAsyncSync() {
        // Prevent concurrent syncs
        List<SyncJob> active = syncJobRepository.findByStatusIn(
                List.of(SyncJobStatus.QUEUED, SyncJobStatus.RUNNING)
        );
        if (!active.isEmpty()) {
            throw AppException.badRequest("Sync already in progress (jobId: " + active.get(0).getId() + ")");
        }

        // Count channels to sync
        List<Channel> channels = channelRepository.findByApprovedTrue();
        if (channels.isEmpty()) {
            throw AppException.badRequest("No approved channels to sync");
        }

        // Create job entry
        SyncJob job = SyncJob.builder()
                .status(SyncJobStatus.QUEUED)
                .totalChannels(channels.size())
                .startedAt(Instant.now())
                .build();
        job = syncJobRepository.save(job);

        log.info("═══ Sync Job {} created (QUEUED) — {} channels ═══", job.getId(), channels.size());

        // Submit to background executor
        try {
            executeAsyncSync(job.getId());
        } catch (RejectedExecutionException e) {
            // Executor full — mark job failed
            job.setStatus(SyncJobStatus.FAILED);
            job.setErrorMessage("Executor busy — sync rejected");
            job.setCompletedAt(Instant.now());
            syncJobRepository.save(job);
            throw AppException.badRequest("Sync executor is busy. Try again later.");
        }

        return job.getId();
    }

    /**
     * Background async worker — processes all channels and updates SyncJob progress
     * in MongoDB after each channel completes.
     */
    @Async("syncExecutor")
    public void executeAsyncSync(String jobId) {
        SyncJob job = syncJobRepository.findById(jobId).orElse(null);
        if (job == null) {
            log.error("SyncJob {} not found — aborting", jobId);
            return;
        }

        // Transition: QUEUED → RUNNING
        job.setStatus(SyncJobStatus.RUNNING);
        job.setStartedAt(Instant.now());
        syncJobRepository.save(job);

        log.info("═══ Sync Job {} RUNNING ═══", jobId);

        List<Channel> channels = channelRepository.findByApprovedTrue();
        job.setTotalChannels(channels.size());

        int channelIndex = 0;

        for (Channel channel : channels) {
            channelIndex++;
            job.setCurrentChannel(channel.getName());
            job.setProgressPercentage(Math.round((float) (channelIndex - 1) / channels.size() * 100));
            syncJobRepository.save(job);

            log.info("▶ [{}/{}] Syncing channel: {}", channelIndex, channels.size(), channel.getName());

            try {
                SyncResultResponse result = syncChannel(channel);

                // Record per-channel result
                SyncJob.ChannelSyncResult channelResult = SyncJob.ChannelSyncResult.builder()
                        .channelId(result.getChannelId())
                        .channelName(result.getChannelName())
                        .status(result.getStatus().name())
                        .videosFound(result.getVideosFound())
                        .videosAdded(result.getVideosAdded())
                        .videosSkipped(result.getVideosSkipped())
                        .durationMs(result.getDurationMs())
                        .build();
                job.getChannelResults().add(channelResult);

                // Update running totals
                job.setTotalVideosFound(job.getTotalVideosFound() + result.getVideosFound());
                job.setTotalVideosAdded(job.getTotalVideosAdded() + result.getVideosAdded());
                job.setProcessedChannels(channelIndex);
                job.setProgressPercentage(Math.round((float) channelIndex / channels.size() * 100));
                syncJobRepository.save(job);

                // Respect YouTube API quota — 500ms delay between channels
                Thread.sleep(500);

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("Sync Job {} interrupted at channel {}", jobId, channel.getName());
                job.setStatus(SyncJobStatus.FAILED);
                job.setErrorMessage("Sync interrupted at channel: " + channel.getName());
                job.setCompletedAt(Instant.now());
                job.setDurationMs(Instant.now().toEpochMilli() - job.getStartedAt().toEpochMilli());
                syncJobRepository.save(job);
                return;
            } catch (Exception e) {
                log.error("Sync failed for channel {}: {}", channel.getName(), e.getMessage());

                // Record failed channel but continue with the rest
                SyncJob.ChannelSyncResult failedResult = SyncJob.ChannelSyncResult.builder()
                        .channelId(channel.getId())
                        .channelName(channel.getName())
                        .status("FAILED")
                        .errorMessage(e.getMessage())
                        .build();
                job.getChannelResults().add(failedResult);
                job.setProcessedChannels(channelIndex);
                job.setProgressPercentage(Math.round((float) channelIndex / channels.size() * 100));
                syncJobRepository.save(job);

                saveSyncLog(channel, SyncStatus.FAILED, 0, 0, 0, e.getMessage(), 0L);
            }
        }

        // ── Job complete ────────────────────────────────────────────
        job.setStatus(SyncJobStatus.COMPLETED);
        job.setCurrentChannel(null);
        job.setProgressPercentage(100);
        job.setCompletedAt(Instant.now());
        job.setDurationMs(Instant.now().toEpochMilli() - job.getStartedAt().toEpochMilli());
        syncJobRepository.save(job);

        long successCount = job.getChannelResults().stream()
                .filter(r -> "SUCCESS".equals(r.getStatus()) || "PARTIAL".equals(r.getStatus()))
                .count();

        log.info("═══ Sync Job {} COMPLETED — {}/{} channels, {} videos found, {} added, {}ms ═══",
                jobId, successCount, channels.size(),
                job.getTotalVideosFound(), job.getTotalVideosAdded(), job.getDurationMs());
    }

    // ════════════════════════════════════════════════════════════════
    //  JOB STATUS & HISTORY — for frontend polling
    // ════════════════════════════════════════════════════════════════

    /** Get current status of a sync job by ID. */
    public SyncJobResponse getJobStatus(String jobId) {
        SyncJob job = syncJobRepository.findById(jobId)
                .orElseThrow(() -> AppException.notFound("Sync job not found: " + jobId));

        // Calculate live duration for running jobs
        if (job.getStatus() == SyncJobStatus.RUNNING && job.getStartedAt() != null) {
            job.setDurationMs(Instant.now().toEpochMilli() - job.getStartedAt().toEpochMilli());
        }

        return SyncJobResponse.from(job);
    }

    /** Paginated history of all sync jobs. */
    public Page<SyncJobResponse> getJobHistory(int page, int size) {
        return syncJobRepository.findAllByOrderByStartedAtDesc(
                PageRequest.of(page, Math.min(size, 100))
        ).map(SyncJobResponse::from);
    }

    // ════════════════════════════════════════════════════════════════
    //  SCHEDULED SYNC — uses async job system
    // ════════════════════════════════════════════════════════════════

    @Scheduled(cron = "0 0 */6 * * *")
    public void scheduledSync() {
        log.info("═══ Scheduled sync triggered ═══");
        try {
            startAsyncSync();
        } catch (Exception e) {
            log.warn("Scheduled sync skipped: {}", e.getMessage());
        }
    }

    // ════════════════════════════════════════════════════════════════
    //  LEGACY BLOCKING SYNC — preserved for backward compatibility
    // ════════════════════════════════════════════════════════════════

    /** Sync ALL approved channels (blocking). Kept for legacy /trigger endpoint. */
    public List<SyncResultResponse> syncAllChannels() {
        List<Channel> channels = channelRepository.findByApprovedTrue();
        log.info("Starting sync for {} approved channels (maxVideosPerChannel={})",
                channels.size(), maxVideosPerChannel);

        List<SyncResultResponse> results = new ArrayList<>();

        for (Channel channel : channels) {
            try {
                SyncResultResponse result = syncChannel(channel);
                results.add(result);

                // Respect YouTube API quota — 500ms delay between channels
                Thread.sleep(500);

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("Sync interrupted");
                break;
            } catch (Exception e) {
                log.error("Sync failed for channel {}: {}", channel.getName(), e.getMessage());
                SyncResultResponse failed = SyncResultResponse.builder()
                        .channelId(channel.getId())
                        .channelName(channel.getName())
                        .status(SyncStatus.FAILED)
                        .errorMessage(e.getMessage())
                        .syncedAt(LocalDateTime.now())
                        .build();
                results.add(failed);
                saveSyncLog(channel, SyncStatus.FAILED, 0, 0, 0, e.getMessage(), 0L);
            }
        }

        long success = results.stream().filter(r -> r.getStatus() == SyncStatus.SUCCESS).count();
        long failed = results.stream().filter(r -> r.getStatus() == SyncStatus.FAILED).count();
        int totalAdded = results.stream().mapToInt(SyncResultResponse::getVideosAdded).sum();
        log.info("Sync complete: {}/{} channels succeeded, {} videos added",
                success, channels.size(), totalAdded);

        return results;
    }

    // ════════════════════════════════════════════════════════════════
    //  SINGLE CHANNEL SYNC — shared by both async and blocking modes
    // ════════════════════════════════════════════════════════════════

    /**
     * Sync a single channel — OPTIMIZED FLOW:
     *
     * <ol>
     *   <li>Fetch ONLY video IDs from YouTube (cheap: 1 quota/page)</li>
     *   <li>Load existing IDs from MongoDB in ONE projection query</li>
     *   <li>Diff → find new-only IDs</li>
     *   <li>Fetch YouTube details ONLY for new IDs (expensive: 1 quota/50 videos)</li>
     *   <li>Build Video objects ONLY for new videos</li>
     *   <li>Bulk saveAll() instead of N individual save() calls</li>
     * </ol>
     */
    public SyncResultResponse syncChannel(Channel channel) {
        long startTime = System.currentTimeMillis();
        log.info("▶ Syncing channel: {} [{}]", channel.getName(), channel.getYoutubeChannelId());

        // ── STEP 1: Fetch ONLY video IDs from YouTube playlist ───
        List<String> playlistVideoIds =
                youTubeApiService.fetchChannelVideoIds(channel.getYoutubeChannelId(), maxVideosPerChannel);

        int videosFound = playlistVideoIds.size();
        log.info("  ├─ Playlist contains: {} videos", videosFound);

        if (videosFound == 0) {
            long durationMs = System.currentTimeMillis() - startTime;
            saveSyncLog(channel, SyncStatus.PARTIAL, 0, 0, 0, null, durationMs);
            return SyncResultResponse.builder()
                    .channelId(channel.getId()).channelName(channel.getName())
                    .status(SyncStatus.PARTIAL).videosFound(0)
                    .syncedAt(LocalDateTime.now()).durationMs(durationMs).build();
        }

        // ── STEP 2: Load existing IDs from MongoDB (ONE query) ───
        Set<String> existingIds = new HashSet<>();
        videoRepository.findYoutubeVideoIdsByYoutubeChannelId(channel.getYoutubeChannelId())
                .forEach(v -> existingIds.add(v.getYoutubeVideoId()));

        log.info("  ├─ Existing in database: {}", existingIds.size());

        // ── STEP 3: Diff — find new-only IDs ─────────────────────
        List<String> newVideoIds = playlistVideoIds.stream()
                .filter(id -> !existingIds.contains(id))
                .toList();

        int videosSkipped = videosFound - newVideoIds.size();
        log.info("  ├─ New videos to fetch: {}", newVideoIds.size());
        log.info("  ├─ Already in DB (skipped): {}", videosSkipped);

        int videosAdded = 0;

        if (!newVideoIds.isEmpty()) {
            // ── STEP 4: Fetch details ONLY for new IDs ───────────
            log.info("  ├─ Fetching details only for {} new videos...", newVideoIds.size());
            List<YouTubeApiService.YouTubeVideoData> newVideoDetails =
                    youTubeApiService.fetchVideoDetails(newVideoIds);

            // Primary domain for this channel
            String domain = channel.getDomains().isEmpty() ? null : channel.getDomains().get(0);

            // ── STEP 5: Build Video objects ONLY for new videos ──
            List<Video> videosToSave = new ArrayList<>(newVideoDetails.size());
            for (YouTubeApiService.YouTubeVideoData videoData : newVideoDetails) {
                Video video = Video.builder()
                        .youtubeVideoId(videoData.getYoutubeVideoId())
                        .channelId(channel.getId())
                        .youtubeChannelId(channel.getYoutubeChannelId())
                        .channelName(channel.getName())
                        .channelAvatar(channel.getThumbnailUrl())
                        .title(videoData.getTitle())
                        .description(videoData.getDescription())
                        .thumbnailUrl(videoData.getThumbnailUrl())
                        .duration(videoData.getDuration())
                        .viewCount(videoData.getViewCount())
                        .viewCountDisplay(YouTubeApiService.formatViewCount(videoData.getViewCount()))
                        .domain(domain)
                        .publishedAt(videoData.getPublishedAt())
                        .synced(true)
                        .build();
                videosToSave.add(video);
            }

            // ── STEP 6: Bulk insert with saveAll() ──────────────
            if (!videosToSave.isEmpty()) {
                log.info("  ├─ Bulk inserting {} videos...", videosToSave.size());
                videoRepository.saveAll(videosToSave);
                videosAdded = videosToSave.size();
            }
        } else {
            log.info("  ├─ No new videos — skipping YouTube detail API and DB insert");
        }

        long durationMs = System.currentTimeMillis() - startTime;
        SyncStatus status = SyncStatus.SUCCESS;

        log.info("  └─ ✅ Channel {} synced in {}ms (playlist={}, new={}, skipped={})",
                channel.getName(), durationMs, videosFound, videosAdded, videosSkipped);

        saveSyncLog(channel, status, videosFound, videosAdded, videosSkipped, null, durationMs);

        return SyncResultResponse.builder()
                .channelId(channel.getId())
                .channelName(channel.getName())
                .status(status)
                .videosFound(videosFound)
                .videosAdded(videosAdded)
                .videosSkipped(videosSkipped)
                .syncedAt(LocalDateTime.now())
                .durationMs(durationMs)
                .build();
    }

    /** Sync single channel by DB id (admin trigger). */
    public SyncResultResponse syncChannelById(String channelId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> AppException.notFound("Channel not found"));
        return syncChannel(channel);
    }

    // ── Save sync log entry ─────────────────────────────────────
    private void saveSyncLog(Channel channel, SyncStatus status,
                             int found, int added, int skipped,
                             String error, Long durationMs) {
        SyncLog syncLog = SyncLog.builder()
                .channelId(channel.getId())
                .channelName(channel.getName())
                .status(status)
                .videosFound(found)
                .videosAdded(added)
                .videosSkipped(skipped)
                .errorMessage(error)
                .syncedAt(LocalDateTime.now())
                .durationMs(durationMs)
                .build();
        syncLogRepository.save(syncLog);
    }
}

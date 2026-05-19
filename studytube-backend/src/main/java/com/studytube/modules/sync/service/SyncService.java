package com.studytube.modules.sync.service;

import com.studytube.common.exception.AppException;
import com.studytube.modules.channel.model.Channel;
import com.studytube.modules.channel.repository.ChannelRepository;
import com.studytube.modules.sync.dto.SyncResultResponse;
import com.studytube.modules.sync.model.SyncLog;
import com.studytube.modules.sync.model.SyncStatus;
import com.studytube.modules.sync.repository.SyncLogRepository;
import com.studytube.modules.video.model.Video;
import com.studytube.modules.video.repository.VideoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Sync service — orchestrates YouTube → MongoDB video syncing.
 * Runs automatically every 6 hours or on-demand by admin.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SyncService {

    private final ChannelRepository channelRepository;
    private final VideoRepository videoRepository;
    private final SyncLogRepository syncLogRepository;
    private final YouTubeApiService youTubeApiService;

    /**
     * Max videos to fetch per channel per sync.
     * Configurable via application.yaml: app.sync.max-videos-per-channel
     * Defaults to 200 if not set.
     */
    @Value("${app.sync.max-videos-per-channel:200}")
    private int maxVideosPerChannel;

    // ── Scheduled: every 6 hours ────────────────────────────────
    @Scheduled(cron = "0 0 */6 * * *")
    public void scheduledSync() {
        log.info("═══ Scheduled sync started ═══");
        syncAllChannels();
        log.info("═══ Scheduled sync completed ═══");
    }

    // ── Sync ALL approved channels ──────────────────────────────
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
                // Log the failure and continue with next channel
                SyncResultResponse failed = SyncResultResponse.builder()
                        .channelId(channel.getId())
                        .channelName(channel.getName())
                        .status(SyncStatus.FAILED)
                        .errorMessage(e.getMessage())
                        .syncedAt(LocalDateTime.now())
                        .build();
                results.add(failed);

                saveSyncLog(channel, SyncStatus.FAILED, 0, 0, 0,
                        e.getMessage(), 0L);
            }
        }

        // Log summary
        long success = results.stream().filter(r -> r.getStatus() == SyncStatus.SUCCESS).count();
        long failed = results.stream().filter(r -> r.getStatus() == SyncStatus.FAILED).count();
        int totalAdded = results.stream().mapToInt(SyncResultResponse::getVideosAdded).sum();
        log.info("Sync complete: {}/{} channels succeeded, {} videos added",
                success, channels.size(), totalAdded);

        return results;
    }

    // ── Sync a SINGLE channel ───────────────────────────────────
    public SyncResultResponse syncChannel(Channel channel) {
        long startTime = System.currentTimeMillis();
        log.info("▶ Syncing channel: {} [{}] — requesting up to {} videos",
                channel.getName(), channel.getYoutubeChannelId(), maxVideosPerChannel);

        // 1. Fetch from YouTube API (with pagination)
        List<YouTubeApiService.YouTubeVideoData> videos =
                youTubeApiService.fetchChannelVideos(channel.getYoutubeChannelId(), maxVideosPerChannel);

        int videosFound = videos.size();
        log.info("  ├─ Fetched {} videos from YouTube API", videosFound);

        int videosAdded = 0;
        int videosSkipped = 0;

        // Primary domain for this channel (first one)
        String domain = channel.getDomains().isEmpty() ? null : channel.getDomains().get(0);

        // 2. Deduplicate and save new videos
        for (YouTubeApiService.YouTubeVideoData videoData : videos) {
            // Skip if already exists
            if (videoRepository.existsByYoutubeVideoId(videoData.getYoutubeVideoId())) {
                videosSkipped++;
                continue;
            }

            // Create new Video document
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

            videoRepository.save(video);
            videosAdded++;
        }

        long durationMs = System.currentTimeMillis() - startTime;
        SyncStatus status = videosFound == 0 ? SyncStatus.PARTIAL : SyncStatus.SUCCESS;

        log.info("  ├─ Already in DB (skipped): {}", videosSkipped);
        log.info("  ├─ New videos saved: {}", videosAdded);
        log.info("  └─ ✅ Channel {} synced in {}ms (found={}, added={}, skipped={})",
                channel.getName(), durationMs, videosFound, videosAdded, videosSkipped);

        // Save sync log
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

    // ── Sync single channel by DB id (admin trigger) ────────────
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

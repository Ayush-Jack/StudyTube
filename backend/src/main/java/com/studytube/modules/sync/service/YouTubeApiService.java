package com.studytube.modules.sync.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studytube.config.YouTubeApiConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * YouTube Data API v3 client — fetches channel videos and video details.
 * Supports pagination (nextPageToken) and batched detail enrichment (max 50 IDs/call).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class YouTubeApiService {

    private final RestTemplate restTemplate;
    private final YouTubeApiConfig config;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * YouTube Search API allows max 50 per page.
     * YouTube Videos API allows max 50 IDs per call.
     */
    private static final int YT_PAGE_SIZE = 50;
    private static final int YT_DETAIL_BATCH = 50;
    private static final long PAGE_DELAY_MS = 200;
    private static final long BATCH_DELAY_MS = 100;

    /**
     * Fetch up to {@code maxResults} videos from a YouTube channel.
     * Uses nextPageToken to paginate through results, collecting up to maxResults videos.
     */
    public List<YouTubeVideoData> fetchChannelVideos(String youtubeChannelId, int maxResults) {
        log.info("[YT-FETCH] Starting fetch for channel={}, target={}", youtubeChannelId, maxResults);

        List<YouTubeVideoData> allVideos = new ArrayList<>();
        String nextPageToken = null;
        int pageNum = 0;

        // How many to request per page (max 50 for search endpoint)
        int perPage = Math.min(maxResults, YT_PAGE_SIZE);

        try {
            do {
                pageNum++;

                // Build URL with optional pageToken
                StringBuilder urlBuilder = new StringBuilder(String.format(
                        "%s/search?part=snippet&channelId=%s&maxResults=%d&order=date&type=video&key=%s",
                        config.getBaseUrl(), youtubeChannelId, perPage, config.getApiKey()
                ));
                if (nextPageToken != null) {
                    urlBuilder.append("&pageToken=").append(nextPageToken);
                }

                String url = urlBuilder.toString();
                log.info("[YT-FETCH] Page {} — requesting {} videos (pageToken={})",
                        pageNum, perPage, nextPageToken != null ? nextPageToken : "NONE");

                String response = restTemplate.getForObject(url, String.class);
                JsonNode root = objectMapper.readTree(response);
                JsonNode items = root.path("items");

                if (items.isMissingNode() || !items.isArray() || items.isEmpty()) {
                    log.warn("[YT-FETCH] Page {} — no items returned, stopping", pageNum);
                    break;
                }

                // Parse this page's results
                int pageCount = 0;
                for (JsonNode item : items) {
                    String videoId = item.path("id").path("videoId").asText(null);
                    if (videoId == null || videoId.isBlank()) continue;

                    JsonNode snippet = item.path("snippet");
                    YouTubeVideoData data = new YouTubeVideoData();
                    data.setYoutubeVideoId(videoId);
                    data.setTitle(snippet.path("title").asText("Untitled"));
                    data.setDescription(snippet.path("description").asText(""));
                    data.setChannelId(snippet.path("channelId").asText(youtubeChannelId));
                    data.setChannelName(snippet.path("channelTitle").asText("Unknown"));

                    // Best thumbnail: maxres > high > medium > default
                    JsonNode thumbs = snippet.path("thumbnails");
                    data.setThumbnailUrl(
                            pickThumbnail(thumbs, "maxres", "high", "medium", "default")
                    );

                    // publishedAt
                    String published = snippet.path("publishedAt").asText(null);
                    if (published != null) {
                        data.setPublishedAt(Instant.parse(published));
                    }

                    allVideos.add(data);
                    pageCount++;
                }

                log.info("[YT-FETCH] Page {} — got {} videos (total so far: {})",
                        pageNum, pageCount, allVideos.size());

                // Get next page token
                nextPageToken = root.path("nextPageToken").asText(null);

                // Stop if we've collected enough
                if (allVideos.size() >= maxResults) {
                    log.info("[YT-FETCH] Reached target {}, stopping pagination", maxResults);
                    break;
                }

                // Delay between pages to respect API rate limits
                if (nextPageToken != null) {
                    Thread.sleep(PAGE_DELAY_MS);
                }

            } while (nextPageToken != null);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("[YT-FETCH] Interrupted during pagination");
        } catch (Exception e) {
            log.error("[YT-FETCH] YouTube search API failed for channel {}: {}",
                    youtubeChannelId, e.getMessage());
            throw new RuntimeException("YouTube API call failed: " + e.getMessage(), e);
        }

        // Trim to exact maxResults if we overshot
        if (allVideos.size() > maxResults) {
            allVideos = new ArrayList<>(allVideos.subList(0, maxResults));
        }

        // Enrich ALL collected videos with duration + viewCount (in batches of 50)
        if (!allVideos.isEmpty()) {
            enrichWithDetails(allVideos);
        }

        log.info("[YT-FETCH] ✅ Final result: {} videos from channel {}",
                allVideos.size(), youtubeChannelId);
        return allVideos;
    }

    /**
     * Enrich video list with duration and viewCount from the videos endpoint.
     * Batches IDs into groups of 50 (YouTube API limit per call).
     */
    private void enrichWithDetails(List<YouTubeVideoData> videos) {
        List<String> allIds = videos.stream()
                .map(YouTubeVideoData::getYoutubeVideoId)
                .toList();

        log.info("[YT-DETAIL] Enriching {} videos in batches of {}", allIds.size(), YT_DETAIL_BATCH);

        // Split into batches of 50
        for (int i = 0; i < allIds.size(); i += YT_DETAIL_BATCH) {
            int end = Math.min(i + YT_DETAIL_BATCH, allIds.size());
            List<String> batch = allIds.subList(i, end);
            int batchNum = (i / YT_DETAIL_BATCH) + 1;

            log.info("[YT-DETAIL] Batch {} — fetching details for {} videos (IDs {}-{})",
                    batchNum, batch.size(), i, end - 1);

            enrichBatch(videos, batch);

            // Delay between batches
            if (end < allIds.size()) {
                try { Thread.sleep(BATCH_DELAY_MS); } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
    }

    /**
     * Fetch details for a single batch of video IDs (max 50).
     */
    private void enrichBatch(List<YouTubeVideoData> videos, List<String> videoIds) {
        String ids = String.join(",", videoIds);
        String url = String.format(
                "%s/videos?part=snippet,contentDetails,statistics&id=%s&key=%s",
                config.getBaseUrl(), ids, config.getApiKey()
        );

        try {
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            JsonNode items = root.path("items");

            if (items.isMissingNode() || !items.isArray()) return;

            int enriched = 0;
            for (JsonNode item : items) {
                String videoId = item.path("id").asText();

                // Find matching video in our list
                YouTubeVideoData match = videos.stream()
                        .filter(v -> v.getYoutubeVideoId().equals(videoId))
                        .findFirst().orElse(null);

                if (match == null) continue;

                // Duration (ISO 8601: PT1H2M3S)
                match.setDuration(
                        item.path("contentDetails").path("duration").asText(null)
                );

                // View count
                String views = item.path("statistics").path("viewCount").asText("0");
                try {
                    match.setViewCount(Long.parseLong(views));
                } catch (NumberFormatException e) {
                    match.setViewCount(0L);
                }

                // Better thumbnail from video detail if available
                JsonNode thumbs = item.path("snippet").path("thumbnails");
                String betterThumb = pickThumbnail(thumbs, "maxres", "high", "medium");
                if (betterThumb != null) {
                    match.setThumbnailUrl(betterThumb);
                }
                enriched++;
            }
            log.info("[YT-DETAIL] Batch enriched: {}/{} videos", enriched, videoIds.size());

        } catch (Exception e) {
            log.warn("[YT-DETAIL] Batch detail fetch failed: {}", e.getMessage());
            // Non-fatal — we still have basic data from search
        }
    }

    /**
     * Pick the best available thumbnail URL from YouTube response.
     */
    private String pickThumbnail(JsonNode thumbnails, String... priorities) {
        for (String key : priorities) {
            JsonNode thumb = thumbnails.path(key);
            if (!thumb.isMissingNode() && thumb.has("url")) {
                return thumb.path("url").asText();
            }
        }
        return null;
    }

    /**
     * Format raw view count into display string (e.g. 1234567 → "1.2M").
     */
    public static String formatViewCount(long views) {
        if (views >= 1_000_000_000) return String.format("%.1fB", views / 1_000_000_000.0);
        if (views >= 1_000_000) return String.format("%.1fM", views / 1_000_000.0);
        if (views >= 1_000) return String.format("%.1fK", views / 1_000.0);
        return String.valueOf(views);
    }

    // ── Inner data class ────────────────────────────────────────
    @lombok.Data
    public static class YouTubeVideoData {
        private String youtubeVideoId;
        private String title;
        private String description;
        private String thumbnailUrl;
        private Instant publishedAt;
        private String duration;       // ISO 8601 e.g. "PT45M23S"
        private long viewCount;
        private String channelId;
        private String channelName;
    }
}

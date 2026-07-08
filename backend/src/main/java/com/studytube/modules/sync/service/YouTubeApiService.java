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
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * YouTube Data API v3 client — fetches channel videos via the Uploads Playlist
 * approach and enriches them with details (duration, viewCount, statistics).
 *
 * <h3>Why Uploads Playlist instead of Search API?</h3>
 * <ul>
 *   <li>The Search API costs <b>100 quota units</b> per call; PlaylistItems costs only <b>1 unit</b>.</li>
 *   <li>Search API is optimised for relevance, not completeness — it routinely skips
 *       older or less-viewed uploads, capping many channels at 3–5 results.</li>
 *   <li>The Uploads Playlist is the canonical, ordered list of every public upload
 *       on a channel and always returns the full catalogue.</li>
 * </ul>
 *
 * <h3>Flow</h3>
 * <ol>
 *   <li>{@code GET /channels?part=contentDetails&id={channelId}} → extract {@code uploads} playlist ID</li>
 *   <li>{@code GET /playlistItems?part=snippet&playlistId=...} with {@code nextPageToken} pagination</li>
 *   <li>Collect video IDs, then enrich in batches of 50 via {@code GET /videos?part=snippet,contentDetails,statistics}</li>
 * </ol>
 *
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
     * YouTube PlaylistItems API allows max 50 per page.
     * YouTube Videos API allows max 50 IDs per call.
     */
    private static final int YT_PAGE_SIZE = 50;
    private static final int YT_DETAIL_BATCH = 50;
    private static final long PAGE_DELAY_MS = 200;
    private static final long BATCH_DELAY_MS = 100;

    // ════════════════════════════════════════════════════════════════
    //  PUBLIC API — called by SyncService
    // ════════════════════════════════════════════════════════════════

    /**
     * Fetch up to {@code maxResults} videos from a YouTube channel using the
     * <b>Uploads Playlist</b> approach — fetches ALL and enriches ALL.
     *
     * <p><b>Legacy method.</b> For optimized sync, use {@link #fetchChannelVideoIds}
     * + {@link #fetchVideoDetails} instead.</p>
     */
    public List<YouTubeVideoData> fetchChannelVideos(String youtubeChannelId, int maxResults) {
        boolean unlimited = maxResults <= 0;
        log.info("[YT-FETCH] Starting {} fetch for channel={}{}",
                unlimited ? "FULL (Unlimited)" : "LIMITED",
                youtubeChannelId,
                unlimited ? "" : ", target=" + maxResults);

        String uploadsPlaylistId = resolveUploadsPlaylistId(youtubeChannelId);
        if (uploadsPlaylistId == null) {
            log.error("[YT-FETCH] Could not resolve uploads playlist for channel {}", youtubeChannelId);
            return List.of();
        }

        log.info("[YT-FETCH] Resolved uploads playlist: {}", uploadsPlaylistId);

        List<YouTubeVideoData> allVideos = fetchPlaylistItems(uploadsPlaylistId, youtubeChannelId, maxResults);

        if (!unlimited && allVideos.size() > maxResults) {
            allVideos = new ArrayList<>(allVideos.subList(0, maxResults));
        }

        if (!allVideos.isEmpty()) {
            enrichWithDetails(allVideos);
        }

        log.info("[YT-FETCH] ✅ Final result: {} videos from channel {}", allVideos.size(), youtubeChannelId);
        return allVideos;
    }

    /**
     * Fetch ONLY video IDs from a channel's uploads playlist — no detail enrichment.
     *
     * <p>This is the optimized first step: collect all video IDs cheaply (1 quota unit/page),
     * then diff against the database, and only call the expensive Videos API for new IDs.</p>
     *
     * @param youtubeChannelId the YouTube channel ID
     * @param maxResults       max videos to fetch (-1 for unlimited)
     * @return list of YouTube video IDs (strings only)
     */
    public List<String> fetchChannelVideoIds(String youtubeChannelId, int maxResults) {
        boolean unlimited = maxResults <= 0;
        log.info("[YT-IDS] Fetching {} video IDs for channel={}",
                unlimited ? "ALL" : "up to " + maxResults, youtubeChannelId);

        String uploadsPlaylistId = resolveUploadsPlaylistId(youtubeChannelId);
        if (uploadsPlaylistId == null) {
            log.error("[YT-IDS] Could not resolve uploads playlist for channel {}", youtubeChannelId);
            return List.of();
        }

        List<String> allIds = fetchPlaylistVideoIds(uploadsPlaylistId, maxResults);

        if (!unlimited && allIds.size() > maxResults) {
            allIds = new ArrayList<>(allIds.subList(0, maxResults));
        }

        log.info("[YT-IDS] ✅ Collected {} video IDs from channel {}", allIds.size(), youtubeChannelId);
        return allIds;
    }

    /**
     * Fetch full details (title, description, duration, viewCount, thumbnail)
     * for a specific list of video IDs. Uses batched requests (50 IDs per call).
     *
     * <p>This is the optimized second step: only called for NEW video IDs that
     * don't already exist in the database.</p>
     *
     * @param videoIds list of YouTube video IDs to fetch details for
     * @return list of fully enriched video data
     */
    public List<YouTubeVideoData> fetchVideoDetails(List<String> videoIds) {
        if (videoIds == null || videoIds.isEmpty()) return List.of();

        log.info("[YT-DETAIL] Fetching details for {} new videos in batches of {}",
                videoIds.size(), YT_DETAIL_BATCH);

        List<YouTubeVideoData> results = new ArrayList<>();

        for (int i = 0; i < videoIds.size(); i += YT_DETAIL_BATCH) {
            int end = Math.min(i + YT_DETAIL_BATCH, videoIds.size());
            List<String> batch = videoIds.subList(i, end);
            int batchNum = (i / YT_DETAIL_BATCH) + 1;

            log.info("[YT-DETAIL] Batch {} — fetching {} videos (IDs {}-{})",
                    batchNum, batch.size(), i, end - 1);

            List<YouTubeVideoData> batchResults = fetchDetailBatch(batch);
            results.addAll(batchResults);

            if (end < videoIds.size()) {
                try { Thread.sleep(BATCH_DELAY_MS); } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }

        log.info("[YT-DETAIL] ✅ Fetched details for {}/{} videos", results.size(), videoIds.size());
        return results;
    }

    // ════════════════════════════════════════════════════════════════
    //  STEP 1 — Resolve uploads playlist ID from channel
    // ════════════════════════════════════════════════════════════════

    /**
     * Call {@code GET /channels?part=contentDetails&id={channelId}} and extract
     * {@code contentDetails.relatedPlaylists.uploads}.
     *
     * <p>Quota cost: <b>1 unit</b> per call.</p>
     *
     * @return the uploads playlist ID (e.g. {@code UU...}), or {@code null} if unavailable
     */
    private String resolveUploadsPlaylistId(String youtubeChannelId) {
        String url = String.format(
                "%s/channels?part=contentDetails&id=%s&key=%s",
                config.getBaseUrl(), youtubeChannelId, config.getApiKey()
        );

        try {
            log.info("[YT-FETCH] Resolving uploads playlist for channel {}", youtubeChannelId);
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            JsonNode items = root.path("items");

            if (items.isMissingNode() || !items.isArray() || items.isEmpty()) {
                log.warn("[YT-FETCH] No channel data returned for {}", youtubeChannelId);
                return null;
            }

            String uploadsId = items.get(0)
                    .path("contentDetails")
                    .path("relatedPlaylists")
                    .path("uploads")
                    .asText(null);

            if (uploadsId == null || uploadsId.isBlank()) {
                log.warn("[YT-FETCH] No uploads playlist found for channel {}", youtubeChannelId);
                return null;
            }

            return uploadsId;

        } catch (Exception e) {
            log.error("[YT-FETCH] Failed to resolve uploads playlist for channel {}: {}",
                    youtubeChannelId, e.getMessage());
            throw new RuntimeException("Failed to resolve uploads playlist: " + e.getMessage(), e);
        }
    }

    // ════════════════════════════════════════════════════════════════
    //  STEP 2a — Paginate playlistItems collecting full data (legacy)
    // ════════════════════════════════════════════════════════════════

    /**
     * Paginate through {@code GET /playlistItems?part=snippet&playlistId=...}
     * collecting video metadata until:
     * <ul>
     *   <li>No more {@code nextPageToken} exists (all videos fetched), OR</li>
     *   <li>{@code maxResults} is reached.</li>
     * </ul>
     *
     * <p>Quota cost: <b>1 unit</b> per page (vs 100 units for Search API).</p>
     *
     * @return list of basic video data (without duration/viewCount — enriched later)
     */
    private List<YouTubeVideoData> fetchPlaylistItems(String playlistId,
                                                       String youtubeChannelId,
                                                       int maxResults) {
        boolean unlimited = maxResults <= 0;
        List<YouTubeVideoData> allVideos = new ArrayList<>();
        Set<String> seenVideoIds = new HashSet<>();
        String nextPageToken = null;
        int pageNum = 0;
        int perPage = unlimited ? YT_PAGE_SIZE : Math.min(maxResults, YT_PAGE_SIZE);

        try {
            do {
                pageNum++;

                // Build URL with optional pageToken
                StringBuilder urlBuilder = new StringBuilder(String.format(
                        "%s/playlistItems?part=snippet&playlistId=%s&maxResults=%d&key=%s",
                        config.getBaseUrl(), playlistId, perPage, config.getApiKey()
                ));
                if (nextPageToken != null) {
                    urlBuilder.append("&pageToken=").append(nextPageToken);
                }

                String url = urlBuilder.toString();
                log.info("[YT-FETCH] Page {} — requesting {} items (pageToken={})",
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
                    JsonNode snippet = item.path("snippet");
                    JsonNode resourceId = snippet.path("resourceId");

                    // playlistItems use snippet.resourceId.videoId (not id.videoId)
                    String videoId = resourceId.path("videoId").asText(null);
                    if (videoId == null || videoId.isBlank()) continue;

                    // Duplicate protection — skip if already collected
                    if (!seenVideoIds.add(videoId)) continue;

                    // Skip private/deleted videos (they have empty titles)
                    String title = snippet.path("title").asText("");
                    if ("Private video".equals(title) || "Deleted video".equals(title)) {
                        continue;
                    }

                    YouTubeVideoData data = new YouTubeVideoData();
                    data.setYoutubeVideoId(videoId);
                    data.setTitle(title);
                    data.setDescription(snippet.path("description").asText(""));
                    data.setChannelId(snippet.path("channelId").asText(youtubeChannelId));
                    data.setChannelName(snippet.path("channelTitle").asText("Unknown"));

                    // Best thumbnail: maxres > high > medium > default
                    JsonNode thumbs = snippet.path("thumbnails");
                    data.setThumbnailUrl(
                            pickThumbnail(thumbs, "maxres", "high", "medium", "default")
                    );

                    // publishedAt — use videoOwnerChannelId's publish time
                    String published = snippet.path("publishedAt").asText(null);
                    if (published != null) {
                        data.setPublishedAt(Instant.parse(published));
                    }

                    allVideos.add(data);
                    pageCount++;
                }

                log.info("[YT-FETCH] Page {} → {} videos (total so far: {})",
                        pageNum, pageCount, allVideos.size());

                // Get next page token
                nextPageToken = root.path("nextPageToken").asText(null);

                // Stop if we've collected enough
                if (maxResults > 0 && allVideos.size() >= maxResults) {
                    log.info("[YT-FETCH] Reached target {}, stopping pagination", maxResults);
                    break;
                }

                // Delay between pages to respect API rate limits
                if (nextPageToken != null) {
                    Thread.sleep(PAGE_DELAY_MS);
                }

            } while (nextPageToken != null);

            log.info("[YT-FETCH] Finished after {} pages — fetched {} unique videos{}",
                    pageNum, allVideos.size(),
                    unlimited ? " (Unlimited mode)" : " (limit: " + maxResults + ")");

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("[YT-FETCH] Interrupted during pagination");
        } catch (Exception e) {
            log.error("[YT-FETCH] PlaylistItems API failed for playlist {}: {}",
                    playlistId, e.getMessage());
            throw new RuntimeException("YouTube PlaylistItems API call failed: " + e.getMessage(), e);
        }

        return allVideos;
    }

    // ════════════════════════════════════════════════════════════════
    //  STEP 2b — Paginate playlistItems collecting ONLY video IDs (optimized)
    // ════════════════════════════════════════════════════════════════

    /**
     * Lightweight pagination — collects only video IDs, no metadata parsing.
     * Skips Private/Deleted videos. Much less memory than full parsing.
     */
    private List<String> fetchPlaylistVideoIds(String playlistId, int maxResults) {
        boolean unlimited = maxResults <= 0;
        List<String> allIds = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        String nextPageToken = null;
        int pageNum = 0;
        int perPage = unlimited ? YT_PAGE_SIZE : Math.min(maxResults, YT_PAGE_SIZE);

        try {
            do {
                pageNum++;
                StringBuilder urlBuilder = new StringBuilder(String.format(
                        "%s/playlistItems?part=snippet&playlistId=%s&maxResults=%d&key=%s",
                        config.getBaseUrl(), playlistId, perPage, config.getApiKey()
                ));
                if (nextPageToken != null) {
                    urlBuilder.append("&pageToken=").append(nextPageToken);
                }

                String response = restTemplate.getForObject(urlBuilder.toString(), String.class);
                JsonNode root = objectMapper.readTree(response);
                JsonNode items = root.path("items");

                if (items.isMissingNode() || !items.isArray() || items.isEmpty()) break;

                int pageCount = 0;
                for (JsonNode item : items) {
                    JsonNode snippet = item.path("snippet");
                    String videoId = snippet.path("resourceId").path("videoId").asText(null);
                    if (videoId == null || videoId.isBlank()) continue;
                    if (!seen.add(videoId)) continue;

                    // Skip private/deleted
                    String title = snippet.path("title").asText("");
                    if ("Private video".equals(title) || "Deleted video".equals(title)) continue;

                    allIds.add(videoId);
                    pageCount++;
                }

                log.info("[YT-IDS] Page {} → {} IDs (total: {})", pageNum, pageCount, allIds.size());

                nextPageToken = root.path("nextPageToken").asText(null);

                if (maxResults > 0 && allIds.size() >= maxResults) break;

                if (nextPageToken != null) {
                    Thread.sleep(PAGE_DELAY_MS);
                }
            } while (nextPageToken != null);

            log.info("[YT-IDS] Finished after {} pages — {} unique IDs{}",
                    pageNum, allIds.size(), unlimited ? " (Unlimited)" : "");

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("[YT-IDS] Interrupted during pagination");
        } catch (Exception e) {
            log.error("[YT-IDS] PlaylistItems API failed: {}", e.getMessage());
            throw new RuntimeException("YouTube PlaylistItems API failed: " + e.getMessage(), e);
        }

        return allIds;
    }

    // ════════════════════════════════════════════════════════════════
    //  STEP 3a — Enrich existing video list in-place (legacy)
    // ════════════════════════════════════════════════════════════════

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

                // Use the actual video publish date (more accurate than playlist add date)
                String published = item.path("snippet").path("publishedAt").asText(null);
                if (published != null) {
                    match.setPublishedAt(Instant.parse(published));
                }

                enriched++;
            }
            log.info("[YT-DETAIL] Batch enriched: {}/{} videos", enriched, videoIds.size());

        } catch (Exception e) {
            log.warn("[YT-DETAIL] Batch detail fetch failed: {}", e.getMessage());
            // Non-fatal — we still have basic data from playlistItems
        }
    }

    // ════════════════════════════════════════════════════════════════
    //  STEP 3b — Fetch full details for specific IDs (optimized)
    // ════════════════════════════════════════════════════════════════

    /**
     * Fetch complete video data for a batch of IDs (max 50).
     * Returns fully populated YouTubeVideoData objects.
     */
    private List<YouTubeVideoData> fetchDetailBatch(List<String> videoIds) {
        String ids = String.join(",", videoIds);
        String url = String.format(
                "%s/videos?part=snippet,contentDetails,statistics&id=%s&key=%s",
                config.getBaseUrl(), ids, config.getApiKey()
        );

        List<YouTubeVideoData> results = new ArrayList<>();
        try {
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            JsonNode items = root.path("items");

            if (items.isMissingNode() || !items.isArray()) return results;

            for (JsonNode item : items) {
                YouTubeVideoData data = new YouTubeVideoData();
                data.setYoutubeVideoId(item.path("id").asText());

                JsonNode snippet = item.path("snippet");
                data.setTitle(snippet.path("title").asText(""));
                data.setDescription(snippet.path("description").asText(""));
                data.setChannelId(snippet.path("channelId").asText(""));
                data.setChannelName(snippet.path("channelTitle").asText("Unknown"));

                JsonNode thumbs = snippet.path("thumbnails");
                data.setThumbnailUrl(pickThumbnail(thumbs, "maxres", "high", "medium", "default"));

                String published = snippet.path("publishedAt").asText(null);
                if (published != null) data.setPublishedAt(Instant.parse(published));

                data.setDuration(item.path("contentDetails").path("duration").asText(null));

                String views = item.path("statistics").path("viewCount").asText("0");
                try { data.setViewCount(Long.parseLong(views)); }
                catch (NumberFormatException e) { data.setViewCount(0L); }

                results.add(data);
            }
            log.info("[YT-DETAIL] Batch returned {}/{} videos", results.size(), videoIds.size());
        } catch (Exception e) {
            log.warn("[YT-DETAIL] Batch detail fetch failed: {}", e.getMessage());
        }
        return results;
    }

    // ════════════════════════════════════════════════════════════════
    //  Helpers
    // ════════════════════════════════════════════════════════════════

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

package com.studytube.modules.video.controller;

import com.studytube.common.response.ApiResponse;
import com.studytube.common.util.AppConstants;
import com.studytube.modules.auth.model.User;
import com.studytube.modules.video.dto.VideoResponse;
import com.studytube.modules.video.service.VideoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Video controller — feed, detail, search, channel filter.
 * Base path: /api/v1/videos
 */
@RestController
@RequestMapping(AppConstants.Api.VIDEOS)
@RequiredArgsConstructor
public class VideoController {

    private final VideoService videoService;

    // ── GET /api/v1/videos/feed — personalized feed ─────────────
    // Authenticated: filters by user's selected domains
    // Unauthenticated: returns all videos
    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<Page<VideoResponse>>> getFeed(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<VideoResponse> feed;
        if (user != null && user.getSelectedDomains() != null && !user.getSelectedDomains().isEmpty()) {
            feed = videoService.getFeed(user.getSelectedDomains(), page, size);
        } else {
            feed = videoService.getAllVideos(page, size);
        }
        return ResponseEntity.ok(ApiResponse.ok(feed));
    }

    // ── GET /api/v1/videos/search?q=calculus ────────────────────
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<VideoResponse>>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<VideoResponse> results = videoService.searchVideos(q, page, size);
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    // ── GET /api/v1/videos/domain/{domain} ──────────────────────
    @GetMapping("/domain/{domain}")
    public ResponseEntity<ApiResponse<Page<VideoResponse>>> getByDomain(
            @PathVariable String domain,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<VideoResponse> videos = videoService.getVideosByDomain(domain, page, size);
        return ResponseEntity.ok(ApiResponse.ok(videos));
    }

    // ── GET /api/v1/videos/channel/{channelId} ──────────────────
    @GetMapping("/channel/{channelId}")
    public ResponseEntity<ApiResponse<Page<VideoResponse>>> getByChannel(
            @PathVariable String channelId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<VideoResponse> videos = videoService.getVideosByChannel(channelId, page, size);
        return ResponseEntity.ok(ApiResponse.ok(videos));
    }

    // ── GET /api/v1/videos/{id} — video detail ─────────────────
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VideoResponse>> getVideo(
            @PathVariable String id
    ) {
        VideoResponse video = videoService.getVideoById(id);
        return ResponseEntity.ok(ApiResponse.ok(video));
    }

    // ── GET /api/v1/videos/yt/{youtubeVideoId} — lookup by YT ID
    @GetMapping("/yt/{youtubeVideoId}")
    public ResponseEntity<ApiResponse<VideoResponse>> getByYoutubeId(
            @PathVariable String youtubeVideoId
    ) {
        VideoResponse video = videoService.getByYoutubeId(youtubeVideoId);
        return ResponseEntity.ok(ApiResponse.ok(video));
    }
}

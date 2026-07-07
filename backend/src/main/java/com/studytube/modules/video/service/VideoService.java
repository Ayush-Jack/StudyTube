package com.studytube.modules.video.service;

import com.studytube.common.exception.AppException;
import com.studytube.modules.video.dto.VideoResponse;
import com.studytube.modules.video.model.Video;
import com.studytube.modules.video.repository.VideoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Video service — personalized feed, detail, search, channel filter.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VideoService {

    private final VideoRepository videoRepository;

    // ── Personalized feed (by user's domains) ───────────────────
    public Page<VideoResponse> getFeed(List<String> domains, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 50));

        Page<Video> videos;
        if (domains == null || domains.isEmpty()) {
            // No domains selected → return all videos
            videos = videoRepository.findAllByOrderByPublishedAtDesc(pageable);
        } else {
            videos = videoRepository.findByDomainInOrderByPublishedAtDesc(domains, pageable);
        }

        return videos.map(this::toResponse);
    }

    // ── All videos (public, no domain filter) ───────────────────
    public Page<VideoResponse> getAllVideos(int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 50));
        return videoRepository.findAllByOrderByPublishedAtDesc(pageable)
                .map(this::toResponse);
    }

    // ── Video detail by ID ──────────────────────────────────────
    public VideoResponse getVideoById(String videoId) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> AppException.notFound("Video not found"));
        return toResponse(video);
    }

    // ── Video detail by YouTube video ID ────────────────────────
    public VideoResponse getByYoutubeId(String youtubeVideoId) {
        Video video = videoRepository.findByYoutubeVideoId(youtubeVideoId)
                .orElseThrow(() -> AppException.notFound("Video not found"));
        return toResponse(video);
    }

    // ── Videos from a specific channel (paginated) ──────────────
    public Page<VideoResponse> getVideosByChannel(String channelId, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 50));
        return videoRepository.findByChannelIdOrderByPublishedAtDesc(channelId, pageable)
                .map(this::toResponse);
    }

    // ── Videos by domain ────────────────────────────────────────
    public Page<VideoResponse> getVideosByDomain(String domain, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 50));
        return videoRepository.findByDomainOrderByPublishedAtDesc(domain, pageable)
                .map(this::toResponse);
    }

    // ── Search by title (regex) ─────────────────────────────────
    public Page<VideoResponse> searchVideos(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 50));
        // Escape regex special chars for safety
        String escapedQuery = query.replaceAll("[^a-zA-Z0-9\\s]", "\\\\$0");
        return videoRepository.searchByTitle(escapedQuery, pageable)
                .map(this::toResponse);
    }

    // ── Mapper ──────────────────────────────────────────────────
    private VideoResponse toResponse(Video v) {
        return VideoResponse.builder()
                .id(v.getId())
                .youtubeVideoId(v.getYoutubeVideoId())
                .channelId(v.getChannelId())
                .channelName(v.getChannelName())
                .channelAvatar(v.getChannelAvatar())
                .title(v.getTitle())
                .description(v.getDescription())
                .thumbnailUrl(v.getThumbnailUrl())
                .duration(v.getDuration())
                .viewCount(v.getViewCount())
                .viewCountDisplay(v.getViewCountDisplay())
                .domain(v.getDomain())
                .publishedAt(v.getPublishedAt())
                .build();
    }
}

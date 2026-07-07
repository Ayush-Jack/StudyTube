package com.studytube.modules.video.repository;

import com.studytube.modules.video.model.Video;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Video repository — paginated feed, channel filter, search, domain filter.
 */
@Repository
public interface VideoRepository extends MongoRepository<Video, String> {

    Optional<Video> findByYoutubeVideoId(String youtubeVideoId);

    boolean existsByYoutubeVideoId(String youtubeVideoId);

    // Personalized feed: videos matching user's selected domains, newest first
    Page<Video> findByDomainInOrderByPublishedAtDesc(List<String> domains, Pageable pageable);

    // All videos (no domain filter) — for unauthenticated / "All" tab
    Page<Video> findAllByOrderByPublishedAtDesc(Pageable pageable);

    // Videos from a specific channel, newest first
    Page<Video> findByChannelIdOrderByPublishedAtDesc(String channelId, Pageable pageable);

    // Text search on title (case-insensitive regex)
    @Query("{ 'title': { $regex: ?0, $options: 'i' } }")
    Page<Video> searchByTitle(String query, Pageable pageable);

    // Videos by domain
    Page<Video> findByDomainOrderByPublishedAtDesc(String domain, Pageable pageable);

    // Count videos for a channel (used in sync)
    long countByChannelId(String channelId);
}

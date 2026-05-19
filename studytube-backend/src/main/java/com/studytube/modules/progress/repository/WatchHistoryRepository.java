package com.studytube.modules.progress.repository;

import com.studytube.modules.progress.model.WatchHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Watch history repository — user progress queries and aggregations.
 */
@Repository
public interface WatchHistoryRepository extends MongoRepository<WatchHistory, String> {

    Optional<WatchHistory> findByUserIdAndVideoId(String userId, String videoId);

    Page<WatchHistory> findByUserIdOrderByWatchedAtDesc(String userId, Pageable pageable);

    long countByUserId(String userId);

    long countByUserIdAndIsCompleted(String userId, boolean isCompleted);

    List<WatchHistory> findByUserId(String userId);

    /**
     * Aggregation: sum total watch duration for a user.
     * Returns a list with one document: { "_id": null, "total": <long> }
     */
    @Aggregation(pipeline = {
            "{ $match: { userId: ?0 } }",
            "{ $group: { _id: null, total: { $sum: '$watchDurationSeconds' } } }"
    })
    List<TotalWatchTime> sumWatchDurationByUserId(String userId);

    /**
     * Aggregation result holder for total watch time.
     */
    interface TotalWatchTime {
        Long getTotal();
    }
}

package com.studytube.modules.sync.repository;

import com.studytube.modules.sync.model.SyncLog;
import com.studytube.modules.sync.model.SyncStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Sync log repository — query sync history for admin dashboard.
 */
@Repository
public interface SyncLogRepository extends MongoRepository<SyncLog, String> {

    Page<SyncLog> findAllByOrderBySyncedAtDesc(Pageable pageable);

    Page<SyncLog> findByChannelIdOrderBySyncedAtDesc(String channelId, Pageable pageable);

    Optional<SyncLog> findTopByChannelIdOrderBySyncedAtDesc(String channelId);

    List<SyncLog> findByStatus(SyncStatus status);
}

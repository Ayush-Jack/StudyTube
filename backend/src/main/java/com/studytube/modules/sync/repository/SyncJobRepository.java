package com.studytube.modules.sync.repository;

import com.studytube.modules.sync.model.SyncJob;
import com.studytube.modules.sync.model.SyncJobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for sync jobs — supports progress polling, history, and startup recovery.
 */
@Repository
public interface SyncJobRepository extends MongoRepository<SyncJob, String> {

    /** Latest job (for quick status check). */
    Optional<SyncJob> findTopByOrderByStartedAtDesc();

    /** Find jobs by status — used to detect stale RUNNING jobs on startup. */
    List<SyncJob> findByStatusIn(List<SyncJobStatus> statuses);

    /** Paginated job history for admin dashboard. */
    Page<SyncJob> findAllByOrderByStartedAtDesc(Pageable pageable);
}

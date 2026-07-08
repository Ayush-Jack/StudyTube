package com.studytube.modules.sync.model;

/**
 * Sync job lifecycle status.
 * Separate from {@link SyncStatus} which tracks per-channel outcomes.
 */
public enum SyncJobStatus {
    QUEUED,      // Job created, waiting for executor thread
    RUNNING,     // Actively syncing channels
    COMPLETED,   // All channels processed successfully
    FAILED       // Job terminated due to unrecoverable error
}

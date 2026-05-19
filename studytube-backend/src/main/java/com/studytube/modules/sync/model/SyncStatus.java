package com.studytube.modules.sync.model;

/**
 * Sync job result status.
 */
public enum SyncStatus {
    SUCCESS,   // all videos processed without errors
    FAILED,    // API call failed entirely
    PARTIAL    // some videos synced, some errors
}

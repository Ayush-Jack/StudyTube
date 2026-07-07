package com.studytube.modules.progress.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * User learning stats — dashboard overview.
 */
@Data
@Builder
public class UserStatsResponse {
    private long totalVideosWatched;
    private long totalVideosCompleted;
    private long totalWatchTimeSeconds;
    private String totalWatchTimeFormatted;   // e.g. "5h 23m"
    private List<String> domainsStudied;
    private String mostWatchedDomain;
}

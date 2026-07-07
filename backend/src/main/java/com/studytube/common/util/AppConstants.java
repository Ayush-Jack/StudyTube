package com.studytube.common.util;

/**
 * Application-wide constants — no magic strings anywhere else in the code.
 * Reference: AppConstants.Api.VIDEOS instead of "/api/v1/videos".
 */
public final class AppConstants {

    private AppConstants() {}  // utility class — no instantiation

    // ── API versioning ───────────────────────────────────────────
    public static final String API_PREFIX = "/api/v1";

    public static final class Api {
        public static final String AUTH     = API_PREFIX + "/auth";
        public static final String USERS    = API_PREFIX + "/users";
        public static final String VIDEOS   = API_PREFIX + "/videos";
        public static final String CHANNELS = API_PREFIX + "/channels";
        public static final String PROGRESS = API_PREFIX + "/progress";
        public static final String ADMIN    = API_PREFIX + "/admin";
        public static final String SYNC     = API_PREFIX + "/sync";
    }

    // ── JWT ───────────────────────────────────────────────────────
    public static final class Jwt {
        public static final String BEARER_PREFIX     = "Bearer ";
        public static final String AUTHORIZATION     = "Authorization";
        public static final String CLAIM_ROLE        = "role";
        public static final String CLAIM_USER_ID     = "userId";
    }

    // ── User roles ────────────────────────────────────────────────
    public static final class Roles {
        public static final String USER  = "ROLE_USER";
        public static final String ADMIN = "ROLE_ADMIN";
    }

    // ── Pagination defaults ───────────────────────────────────────
    public static final class Page {
        public static final int DEFAULT_PAGE = 0;
        public static final int DEFAULT_SIZE = 20;
        public static final int MAX_SIZE     = 100;
    }

    // ── YouTube sync ──────────────────────────────────────────────
    public static final class YouTube {
        public static final int MAX_RESULTS      = 50;
        public static final String SNIPPET       = "snippet";
        public static final String CONTENT_DETAILS = "contentDetails";
        public static final String STATISTICS    = "statistics";
    }

    // ── Study domains ─────────────────────────────────────────────
    public static final class Domain {
        public static final String ENGINEERING  = "Engineering";
        public static final String MEDICAL      = "Medical";
        public static final String LAW          = "Law";
        public static final String SCIENCE      = "Science";
        public static final String MATHEMATICS  = "Mathematics";
        public static final String COMMERCE     = "Commerce";
        public static final String UPSC         = "UPSC";
        public static final String JEE_NEET     = "JEE/NEET";
        public static final String PROGRAMMING  = "Programming";
    }
}

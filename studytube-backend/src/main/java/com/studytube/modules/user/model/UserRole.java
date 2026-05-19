package com.studytube.modules.user.model;

/**
 * User roles — controls access across all endpoints via @PreAuthorize.
 */
public enum UserRole {
    USER,    // regular student
    ADMIN    // platform administrator (can manage channels, approve content)
}

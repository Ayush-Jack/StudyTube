package com.studytube.modules.user.dto;

import com.studytube.modules.user.model.UserRole;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

/**
 * Full user profile response — returned by GET /api/v1/users/me.
 */
@Data
@Builder
public class UserProfileResponse {
    private String id;
    private String name;
    private String email;
    private String avatar;
    private UserRole role;
    private List<String> selectedDomains;
    private boolean hasOnboarded;
    private String provider;
    private Instant createdAt;
    private Instant updatedAt;
}

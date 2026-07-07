package com.studytube.modules.auth.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Auth response — returned on register, login, Google auth, and refresh.
 * Contains JWT tokens + user profile.
 */
@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private UserDto user;
}

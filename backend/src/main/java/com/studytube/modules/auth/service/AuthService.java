package com.studytube.modules.auth.service;

import com.studytube.common.exception.AppException;
import com.studytube.config.JwtService;
import com.studytube.modules.auth.dto.*;
import com.studytube.modules.auth.model.RefreshToken;
import com.studytube.modules.auth.model.User;
import com.studytube.modules.auth.repository.RefreshTokenRepository;
import com.studytube.modules.auth.repository.UserRepository;
import com.studytube.modules.user.model.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

/**
 * Auth service — handles register, login, Google OAuth, refresh, and logout.
 * All methods return AuthResponse (access token + refresh token + user DTO).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GoogleOAuthService googleOAuthService;

    // ── Register (email + password) ─────────────────────────────
    public AuthResponse register(RegisterRequest request) {
        // Check duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw AppException.conflict("Email already registered");
        }

        // Create user with hashed password
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .provider("local")
                .role(UserRole.USER)
                .build();

        user = userRepository.save(user);
        log.info("User registered: {}", user.getEmail());

        return buildAuthResponse(user);
    }

    // ── Login (email + password) ────────────────────────────────
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> AppException.unauthorized("Invalid email or password"));

        // OAuth-only user trying to login with password
        if (user.getPassword() == null) {
            throw AppException.unauthorized("This account uses Google Sign-In. Please login with Google.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw AppException.unauthorized("Invalid email or password");
        }

        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    // ── Google OAuth login/register ─────────────────────────────
    public AuthResponse googleAuth(GoogleAuthRequest request) {
        GoogleOAuthService.GoogleUserInfo info = googleOAuthService.verifyIdToken(request.getIdToken());

        // Check if user exists by googleId or email
        User user = userRepository.findByGoogleId(info.googleId())
                .orElseGet(() -> userRepository.findByEmail(info.email())
                        .orElse(null));

        if (user == null) {
            // First time → create new user
            user = User.builder()
                    .name(info.name())
                    .email(info.email())
                    .avatar(info.avatar())
                    .googleId(info.googleId())
                    .provider("google")
                    .role(UserRole.USER)
                    .build();
            user = userRepository.save(user);
            log.info("New Google user created: {}", user.getEmail());
        } else if (user.getGoogleId() == null) {
            // Existing local user → link Google account
            user.setGoogleId(info.googleId());
            user.setProvider("google");
            if (user.getAvatar() == null) {
                user.setAvatar(info.avatar());
            }
            user = userRepository.save(user);
            log.info("Linked Google account to existing user: {}", user.getEmail());
        }

        return buildAuthResponse(user);
    }

    // ── Refresh access token ────────────────────────────────────
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> AppException.unauthorized("Invalid refresh token"));

        // Check expiry
        if (storedToken.getExpiresAt().isBefore(Instant.now())) {
            refreshTokenRepository.delete(storedToken);
            throw AppException.unauthorized("Refresh token expired — please login again");
        }

        User user = userRepository.findById(storedToken.getUserId())
                .orElseThrow(() -> AppException.unauthorized("User not found"));

        // Delete old refresh token (rotation)
        refreshTokenRepository.delete(storedToken);

        log.info("Token refreshed for user: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    // ── Logout (invalidate refresh token) ───────────────────────
    public void logout(RefreshTokenRequest request) {
        refreshTokenRepository.deleteByToken(request.getRefreshToken());
        log.info("User logged out (refresh token invalidated)");
    }

    // ── Logout all devices ──────────────────────────────────────
    public void logoutAll(String userId) {
        refreshTokenRepository.deleteByUserId(userId);
        log.info("All sessions invalidated for userId: {}", userId);
    }

    // ── Private helpers ─────────────────────────────────────────

    /**
     * Builds AuthResponse with fresh access + refresh tokens.
     */
    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name()
        );

        // Create and persist refresh token
        RefreshToken refreshToken = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .userId(user.getId())
                .expiresAt(Instant.now().plusMillis(jwtService.getRefreshTokenExpiryMs()))
                .createdAt(Instant.now())
                .build();
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .user(toDto(user))
                .build();
    }

    /**
     * Maps User entity to UserDto (safe projection — no password).
     */
    private UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .avatar(user.getAvatar())
                .role(user.getRole())
                .selectedDomains(user.getSelectedDomains())
                .hasOnboarded(user.isHasOnboarded())
                .build();
    }
}

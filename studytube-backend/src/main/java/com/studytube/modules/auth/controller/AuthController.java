package com.studytube.modules.auth.controller;

import com.studytube.common.response.ApiResponse;
import com.studytube.common.util.AppConstants;
import com.studytube.modules.auth.dto.*;
import com.studytube.modules.auth.model.User;
import com.studytube.modules.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Auth controller — register, login, Google OAuth, refresh, logout.
 * Base path: /api/v1/auth
 */
@RestController
@RequestMapping(AppConstants.Api.AUTH)
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ── POST /api/v1/auth/register ──────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        AuthResponse response = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created("User registered successfully", response));
    }

    // ── POST /api/v1/auth/login ─────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request
    ) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    // ── POST /api/v1/auth/google ────────────────────────────────
    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleAuth(
            @Valid @RequestBody GoogleAuthRequest request
    ) {
        AuthResponse response = authService.googleAuth(request);
        return ResponseEntity.ok(ApiResponse.ok("Google authentication successful", response));
    }

    // ── POST /api/v1/auth/refresh ───────────────────────────────
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request
    ) {
        AuthResponse response = authService.refresh(request);
        return ResponseEntity.ok(ApiResponse.ok("Token refreshed", response));
    }

    // ── POST /api/v1/auth/logout ────────────────────────────────
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @Valid @RequestBody RefreshTokenRequest request
    ) {
        authService.logout(request);
        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully", null));
    }

    // ── POST /api/v1/auth/logout-all ────────────────────────────
    @PostMapping("/logout-all")
    public ResponseEntity<ApiResponse<Void>> logoutAll(
            @AuthenticationPrincipal User user
    ) {
        authService.logoutAll(user.getId());
        return ResponseEntity.ok(ApiResponse.ok("All sessions invalidated", null));
    }

    // ── GET /api/v1/auth/me — quick "who am I" check ────────────
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> me(
            @AuthenticationPrincipal User user
    ) {
        UserDto dto = UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .avatar(user.getAvatar())
                .role(user.getRole())
                .selectedDomains(user.getSelectedDomains())
                .hasOnboarded(user.isHasOnboarded())
                .build();
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }
}

package com.studytube.modules.user.controller;

import com.studytube.common.response.ApiResponse;
import com.studytube.common.util.AppConstants;
import com.studytube.modules.auth.model.User;
import com.studytube.modules.user.dto.UpdateDomainsRequest;
import com.studytube.modules.user.dto.UpdateProfileRequest;
import com.studytube.modules.user.dto.UserProfileResponse;
import com.studytube.modules.user.model.Domain;
import com.studytube.modules.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

/**
 * User controller — profile and domain selection.
 * All endpoints require JWT authentication.
 * Base path: /api/v1/users
 */
@RestController
@RequestMapping(AppConstants.Api.USERS)
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ── GET /api/v1/users/me — get current user profile ─────────
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(
            @AuthenticationPrincipal User user
    ) {
        UserProfileResponse profile = userService.getProfile(user);
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    // ── PUT /api/v1/users/me — update name/avatar ───────────────
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        UserProfileResponse profile = userService.updateProfile(user, request);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated", profile));
    }

    // ── PUT /api/v1/users/me/domains — select study domains ─────
    @PutMapping("/me/domains")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateDomains(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateDomainsRequest request
    ) {
        UserProfileResponse profile = userService.updateDomains(user, request);
        return ResponseEntity.ok(ApiResponse.ok("Domains updated", profile));
    }

    // ── GET /api/v1/users/domains — list all available domains ──
    @GetMapping("/domains")
    public ResponseEntity<ApiResponse<List<String>>> listDomains() {
        List<String> domains = Arrays.stream(Domain.values())
                .map(Domain::getLabel)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(domains));
    }
}

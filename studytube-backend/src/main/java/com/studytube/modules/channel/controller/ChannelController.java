package com.studytube.modules.channel.controller;

import com.studytube.common.response.ApiResponse;
import com.studytube.common.util.AppConstants;
import com.studytube.modules.auth.model.User;
import com.studytube.modules.channel.dto.AddChannelRequest;
import com.studytube.modules.channel.dto.ChannelResponse;
import com.studytube.modules.channel.service.ChannelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Channel controller — admin CRUD + public channel listing.
 */
@RestController
@RequiredArgsConstructor
public class ChannelController {

    private final ChannelService channelService;

    // ═══════════════════════════════════════════════════════════════
    // PUBLIC ENDPOINTS — /api/v1/channels
    // ═══════════════════════════════════════════════════════════════

    // ── GET /api/v1/channels — list approved channels ───────────
    @GetMapping(AppConstants.Api.CHANNELS)
    public ResponseEntity<ApiResponse<List<ChannelResponse>>> listApproved() {
        List<ChannelResponse> channels = channelService.listApprovedChannels();
        return ResponseEntity.ok(ApiResponse.ok(channels));
    }

    // ── GET /api/v1/channels/{id} — channel detail ──────────────
    @GetMapping(AppConstants.Api.CHANNELS + "/{id}")
    public ResponseEntity<ApiResponse<ChannelResponse>> getChannel(
            @PathVariable String id
    ) {
        ChannelResponse channel = channelService.getChannelById(id);
        return ResponseEntity.ok(ApiResponse.ok(channel));
    }

    // ═══════════════════════════════════════════════════════════════
    // ADMIN ENDPOINTS — /api/v1/admin/channels
    // ═══════════════════════════════════════════════════════════════

    // ── POST /api/v1/admin/channels — add channel ───────────────
    @PostMapping(AppConstants.Api.ADMIN + "/channels")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ChannelResponse>> addChannel(
            @Valid @RequestBody AddChannelRequest request,
            @AuthenticationPrincipal User admin
    ) {
        ChannelResponse channel = channelService.addChannel(request, admin.getId());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created("Channel added", channel));
    }

    // ── GET /api/v1/admin/channels — list ALL channels ──────────
    @GetMapping(AppConstants.Api.ADMIN + "/channels")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ChannelResponse>>> listAll() {
        List<ChannelResponse> channels = channelService.listAllChannels();
        return ResponseEntity.ok(ApiResponse.ok(channels));
    }

    // ── PATCH /api/v1/admin/channels/{id}/toggle — approve/disable
    @PatchMapping(AppConstants.Api.ADMIN + "/channels/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ChannelResponse>> toggleApproval(
            @PathVariable String id
    ) {
        ChannelResponse channel = channelService.toggleApproval(id);
        return ResponseEntity.ok(ApiResponse.ok("Channel approval toggled", channel));
    }

    // ── DELETE /api/v1/admin/channels/{id} — remove channel ─────
    @DeleteMapping(AppConstants.Api.ADMIN + "/channels/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteChannel(
            @PathVariable String id
    ) {
        channelService.deleteChannel(id);
        return ResponseEntity.ok(ApiResponse.ok("Channel deleted", null));
    }
}

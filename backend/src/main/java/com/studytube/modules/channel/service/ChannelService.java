package com.studytube.modules.channel.service;

import com.studytube.common.exception.AppException;
import com.studytube.modules.channel.dto.AddChannelRequest;
import com.studytube.modules.channel.dto.ChannelResponse;
import com.studytube.modules.channel.model.Channel;
import com.studytube.modules.channel.repository.ChannelRepository;
import com.studytube.modules.user.model.Domain;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Channel service — admin CRUD + public browsing of approved channels.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChannelService {

    private final ChannelRepository channelRepository;

    // ── Admin: add a new channel ────────────────────────────────
    public ChannelResponse addChannel(AddChannelRequest request, String adminUserId) {
        if (channelRepository.existsByYoutubeChannelId(request.getYoutubeChannelId())) {
            throw AppException.conflict("Channel already exists: " + request.getYoutubeChannelId());
        }

        // Validate domains
        List<String> validDomains = request.getDomains().stream()
                .map(label -> {
                    Domain d = Domain.fromLabel(label);
                    if (d == null) throw AppException.badRequest("Invalid domain: " + label);
                    return d.getLabel();
                })
                .distinct()
                .toList();

        Channel channel = Channel.builder()
                .youtubeChannelId(request.getYoutubeChannelId())
                .name(request.getName())
                .handle(request.getHandle())
                .description(request.getDescription())
                .thumbnailUrl(request.getThumbnailUrl())
                .subscriberCount(request.getSubscriberCount())
                .domains(validDomains)
                .approved(true)
                .addedBy(adminUserId)
                .build();

        channel = channelRepository.save(channel);
        log.info("Channel added: {} [{}] by admin {}", channel.getName(),
                channel.getYoutubeChannelId(), adminUserId);
        return toResponse(channel);
    }

    // ── Admin: list ALL channels (including unapproved) ─────────
    public List<ChannelResponse> listAllChannels() {
        return channelRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    // ── Admin: toggle approval ──────────────────────────────────
    public ChannelResponse toggleApproval(String channelId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> AppException.notFound("Channel not found"));
        channel.setApproved(!channel.isApproved());
        channel = channelRepository.save(channel);
        log.info("Channel {} → approved={}", channel.getName(), channel.isApproved());
        return toResponse(channel);
    }

    // ── Admin: delete channel ───────────────────────────────────
    public void deleteChannel(String channelId) {
        if (!channelRepository.existsById(channelId)) {
            throw AppException.notFound("Channel not found");
        }
        channelRepository.deleteById(channelId);
        log.info("Channel deleted: {}", channelId);
    }

    // ── Public: list approved channels ──────────────────────────
    public List<ChannelResponse> listApprovedChannels() {
        return channelRepository.findByApprovedTrue().stream()
                .map(this::toResponse)
                .toList();
    }

    // ── Public: get channel by ID ───────────────────────────────
    public ChannelResponse getChannelById(String channelId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> AppException.notFound("Channel not found"));
        return toResponse(channel);
    }

    // ── Mapper ──────────────────────────────────────────────────
    private ChannelResponse toResponse(Channel c) {
        return ChannelResponse.builder()
                .id(c.getId())
                .youtubeChannelId(c.getYoutubeChannelId())
                .name(c.getName())
                .handle(c.getHandle())
                .description(c.getDescription())
                .thumbnailUrl(c.getThumbnailUrl())
                .subscriberCount(c.getSubscriberCount())
                .domains(c.getDomains())
                .approved(c.isApproved())
                .createdAt(c.getCreatedAt())
                .build();
    }
}

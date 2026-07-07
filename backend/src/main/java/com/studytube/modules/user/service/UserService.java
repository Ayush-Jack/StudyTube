package com.studytube.modules.user.service;

import com.studytube.common.exception.AppException;
import com.studytube.modules.auth.model.User;
import com.studytube.modules.auth.repository.UserRepository;
import com.studytube.modules.user.dto.UpdateDomainsRequest;
import com.studytube.modules.user.dto.UpdateProfileRequest;
import com.studytube.modules.user.dto.UserProfileResponse;
import com.studytube.modules.user.model.Domain;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * User service — profile retrieval, updates, and domain selection (onboarding).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    // ── Get profile ─────────────────────────────────────────────
    public UserProfileResponse getProfile(User user) {
        return toProfileResponse(user);
    }

    // ── Update profile (name, avatar) ───────────────────────────
    public UserProfileResponse updateProfile(User user, UpdateProfileRequest request) {
        user.setName(request.getName());

        if (request.getAvatar() != null && !request.getAvatar().isBlank()) {
            user.setAvatar(request.getAvatar());
        }

        User saved = userRepository.save(user);
        log.info("Profile updated for user: {}", saved.getEmail());
        return toProfileResponse(saved);
    }

    // ── Update domains (onboarding + later changes) ─────────────
    public UserProfileResponse updateDomains(User user, UpdateDomainsRequest request) {
        // Validate each domain label
        List<String> validated = request.getSelectedDomains().stream()
                .map(label -> {
                    Domain domain = Domain.fromLabel(label);
                    if (domain == null) {
                        throw AppException.badRequest("Invalid domain: " + label
                                + ". Valid options: Engineering, Medical, Law, Science, "
                                + "Mathematics, Commerce, UPSC, JEE/NEET, Programming");
                    }
                    return domain.getLabel(); // normalize casing
                })
                .distinct()
                .toList();

        user.setSelectedDomains(validated);

        // Mark onboarded if first time selecting domains
        if (!user.isHasOnboarded()) {
            user.setHasOnboarded(true);
            log.info("User onboarded: {} → domains: {}", user.getEmail(), validated);
        }

        User saved = userRepository.save(user);
        return toProfileResponse(saved);
    }

    // ── Private: map User entity → profile response ─────────────
    private UserProfileResponse toProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .avatar(user.getAvatar())
                .role(user.getRole())
                .selectedDomains(user.getSelectedDomains())
                .hasOnboarded(user.isHasOnboarded())
                .provider(user.getProvider())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}

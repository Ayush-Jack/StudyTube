package com.studytube.modules.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studytube.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Verifies Google ID tokens by calling Google's tokeninfo endpoint.
 * Extracts: sub (googleId), email, name, picture (avatar).
 *
 * In production, you should use the Google API Client Library for proper
 * signature verification. This approach is simpler for MVP.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleOAuthService {

    private static final String GOOGLE_TOKEN_INFO_URL =
            "https://oauth2.googleapis.com/tokeninfo?id_token=";

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Verify Google ID token and extract user info.
     * Returns a simple record with the fields we need.
     */
    public GoogleUserInfo verifyIdToken(String idToken) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String response = restTemplate.getForObject(GOOGLE_TOKEN_INFO_URL + idToken, String.class);
            JsonNode json = objectMapper.readTree(response);

            // Verify the token has required fields
            String email = json.has("email") ? json.get("email").asText() : null;
            if (email == null || email.isBlank()) {
                throw AppException.unauthorized("Google token missing email claim");
            }

            return new GoogleUserInfo(
                    json.get("sub").asText(),
                    email,
                    json.has("name") ? json.get("name").asText() : email.split("@")[0],
                    json.has("picture") ? json.get("picture").asText() : null
            );

        } catch (AppException e) {
            throw e;  // re-throw our own exceptions
        } catch (Exception e) {
            log.error("Google token verification failed: {}", e.getMessage());
            throw AppException.unauthorized("Invalid Google ID token");
        }
    }

    /**
     * Simple record to carry verified Google user info.
     */
    public record GoogleUserInfo(
            String googleId,
            String email,
            String name,
            String avatar
    ) {}
}

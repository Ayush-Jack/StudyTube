package com.studytube.config;

import com.studytube.common.util.AppConstants;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

/**
 * JWT service — generates and validates access tokens using jjwt 0.12.x.
 * Reads secret + expiry from application.yml (app.jwt.*)
 */
@Service
@Slf4j
public class JwtService {

    private final SecretKey signingKey;
    private final long accessTokenExpiry;
    private final long refreshTokenExpiry;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-expiry}") long accessTokenExpiry,
            @Value("${app.jwt.refresh-token-expiry}") long refreshTokenExpiry
    ) {
        // Pad secret to at least 32 bytes for HS256
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            keyBytes = padded;
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenExpiry = accessTokenExpiry;
        this.refreshTokenExpiry = refreshTokenExpiry;
    }

    // ── Generate access token ────────────────────────────────────
    public String generateAccessToken(String userId, String email, String role) {
        return Jwts.builder()
                .subject(email)
                .claim(AppConstants.Jwt.CLAIM_USER_ID, userId)
                .claim(AppConstants.Jwt.CLAIM_ROLE, role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiry))
                .signWith(signingKey)
                .compact();
    }

    // ── Generate refresh token (longer expiry, minimal claims) ───
    public String generateRefreshToken(String userId) {
        return Jwts.builder()
                .subject(userId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshTokenExpiry))
                .signWith(signingKey)
                .compact();
    }

    // ── Extract all claims ───────────────────────────────────────
    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // ── Extract email (subject of access token) ──────────────────
    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    // ── Extract userId from access token claims ──────────────────
    public String extractUserId(String token) {
        return extractClaims(token).get(AppConstants.Jwt.CLAIM_USER_ID, String.class);
    }

    // ── Extract role ─────────────────────────────────────────────
    public String extractRole(String token) {
        return extractClaims(token).get(AppConstants.Jwt.CLAIM_ROLE, String.class);
    }

    // ── Validate token (not expired, valid signature) ────────────
    public boolean isTokenValid(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.debug("JWT expired: {}", e.getMessage());
        } catch (JwtException e) {
            log.debug("JWT invalid: {}", e.getMessage());
        }
        return false;
    }

    // ── Get refresh token expiry in milliseconds (for DB storage)─
    public long getRefreshTokenExpiryMs() {
        return refreshTokenExpiry;
    }
}

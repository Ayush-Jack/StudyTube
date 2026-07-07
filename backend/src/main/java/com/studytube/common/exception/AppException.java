package com.studytube.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Application-level business exception.
 * Throw this instead of raw RuntimeException so GlobalExceptionHandler maps it cleanly.
 *
 * Usage:
 *   throw new AppException(HttpStatus.NOT_FOUND, "Video not found");
 *   throw AppException.conflict("Email already registered");
 *   throw AppException.unauthorized("Invalid or expired token");
 */
@Getter
public class AppException extends RuntimeException {

    private final HttpStatus status;

    public AppException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    // ── Static factories for the most common cases ───────────────

    public static AppException notFound(String message) {
        return new AppException(HttpStatus.NOT_FOUND, message);
    }

    public static AppException badRequest(String message) {
        return new AppException(HttpStatus.BAD_REQUEST, message);
    }

    public static AppException unauthorized(String message) {
        return new AppException(HttpStatus.UNAUTHORIZED, message);
    }

    public static AppException forbidden(String message) {
        return new AppException(HttpStatus.FORBIDDEN, message);
    }

    public static AppException conflict(String message) {
        return new AppException(HttpStatus.CONFLICT, message);
    }

    public static AppException internalError(String message) {
        return new AppException(HttpStatus.INTERNAL_SERVER_ERROR, message);
    }
}

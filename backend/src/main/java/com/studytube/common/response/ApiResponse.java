package com.studytube.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.time.Instant;

/**
 * Universal API response wrapper.
 * Every endpoint returns: { success, message, data, timestamp }
 * Use the static factory methods for consistency.
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final boolean success;
    private final String message;
    private final T data;
    @Builder.Default
    private final Instant timestamp = Instant.now();
    private final Integer status;

    // ── Factory: 200 OK ──────────────────────────────────────────
    public static <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.OK.value())
                .build();
    }

    public static <T> ApiResponse<T> ok(T data) {
        return ok("Success", data);
    }

    // ── Factory: 201 Created ─────────────────────────────────────
    public static <T> ApiResponse<T> created(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.CREATED.value())
                .build();
    }

    // ── Factory: Error ───────────────────────────────────────────
    public static <T> ApiResponse<T> error(int status, String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .status(status)
                .build();
    }

    public static <T> ApiResponse<T> error(HttpStatus status, String message) {
        return error(status.value(), message);
    }
}

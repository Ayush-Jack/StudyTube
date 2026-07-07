package com.studytube.modules.auth.dto;

import com.studytube.modules.user.model.UserRole;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Minimal user info returned inside AuthResponse — never expose password hash.
 */
@Data
@Builder
public class UserDto {
    private String id;
    private String name;
    private String email;
    private String avatar;
    private UserRole role;
    private List<String> selectedDomains;
    private boolean hasOnboarded;
}

package com.studytube.modules.auth.model;

import com.studytube.modules.user.model.UserRole;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * User document — supports both local (email+password) and Google OAuth2 login.
 * Collection: "users"
 */
@Document(collection = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    private String password;           // BCrypt hash — null for OAuth-only users

    private String avatar;

    private String googleId;           // Google sub claim — null for local-only users

    @Builder.Default
    private String provider = "local"; // "local" | "google"

    @Builder.Default
    private UserRole role = UserRole.USER;

    @Builder.Default
    private List<String> selectedDomains = new ArrayList<>();

    @Builder.Default
    private boolean hasOnboarded = false;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}

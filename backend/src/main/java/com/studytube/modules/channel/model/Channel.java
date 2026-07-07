package com.studytube.modules.channel.model;

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
 * Approved YouTube channel — added by admin.
 * Videos are synced from this channel via YouTube Data API.
 */
@Document(collection = "channels")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Channel {

    @Id
    private String id;

    @Indexed(unique = true)
    private String youtubeChannelId;

    private String name;
    private String handle;          // e.g. @PhysicsWallah
    private String description;
    private String thumbnailUrl;
    private String subscriberCount; // display string e.g. "8.2M"

    // Domains this channel covers (one channel can span multiple)
    @Builder.Default
    private List<String> domains = new ArrayList<>();

    @Builder.Default
    private boolean approved = true;

    private String addedBy;         // admin userId who added this channel

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}

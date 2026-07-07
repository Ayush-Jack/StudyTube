package com.studytube.modules.channel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * Request to add a new YouTube channel — admin only.
 */
@Data
public class AddChannelRequest {

    @NotBlank(message = "YouTube channel ID is required")
    private String youtubeChannelId;

    @NotBlank(message = "Channel name is required")
    private String name;

    private String handle;          // @ChannelHandle — optional
    private String description;
    private String thumbnailUrl;
    private String subscriberCount;

    @NotEmpty(message = "At least one domain is required")
    private List<String> domains;
}

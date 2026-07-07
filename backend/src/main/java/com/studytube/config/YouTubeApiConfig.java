package com.studytube.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * YouTube Data API v3 configuration — reads api-key and base-url
 * from application.yaml. Provides a shared RestTemplate bean.
 */
@Configuration
@Getter
public class YouTubeApiConfig {

    @Value("${app.youtube.api-key}")
    private String apiKey;

    @Value("${app.youtube.base-url}")
    private String baseUrl;

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

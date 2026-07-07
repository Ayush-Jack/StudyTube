package com.studytube.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

/**
 * Enables @CreatedDate / @LastModifiedDate on MongoDB documents.
 */
@Configuration
@EnableMongoAuditing
public class MongoConfig {
}

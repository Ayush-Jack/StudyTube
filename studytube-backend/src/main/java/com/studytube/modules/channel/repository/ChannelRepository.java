package com.studytube.modules.channel.repository;

import com.studytube.modules.channel.model.Channel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Channel repository — queries for admin management and public browsing.
 */
@Repository
public interface ChannelRepository extends MongoRepository<Channel, String> {

    Optional<Channel> findByYoutubeChannelId(String youtubeChannelId);

    boolean existsByYoutubeChannelId(String youtubeChannelId);

    List<Channel> findByApprovedTrue();

    List<Channel> findByApprovedTrueAndDomainsIn(List<String> domains);
}

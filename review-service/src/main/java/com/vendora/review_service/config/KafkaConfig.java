package com.vendora.review_service.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
@EnableKafka
public class KafkaConfig {
    public static final String REVIEW_TOPIC="review-created";
    @Bean
    NewTopic reviewTopic(){
        return TopicBuilder.name(REVIEW_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }
}

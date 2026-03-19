package com.booking_service.booking_service.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {
    @Bean
    public NewTopic bookingCreatedTopic(){
        return TopicBuilder.name("booking.created")
                .partitions(1)
                .replicas(1)
                .build();
    }
    @Bean
    public NewTopic bookingConfirmedTopic(){
        return TopicBuilder.name("booking.confirmed")
                .partitions(1)
                .replicas(1)
                .build();
    }
    @Bean
    public NewTopic bookingCanceledTopic(){
        return TopicBuilder.name("booking.cancelled")
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean NewTopic bookingCompletedTopic(){
        return TopicBuilder.name("booking.completed")
                .partitions(1)
                .replicas(1)
                .build();
    }
}

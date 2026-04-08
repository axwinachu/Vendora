package com.vendora.notification_service.config;

import com.vendora.notification_service.event.BookingEvent;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.JsonDeserializer;

import java.util.ConcurrentModificationException;
import java.util.Map;

@Configuration
@EnableKafka
public class KafkaConsumerConfig {
    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;
    @Bean
    public ConsumerFactory<String, BookingEvent> consumerFactory(){
        JsonDeserializer<BookingEvent> deserializer=new JsonDeserializer<>(BookingEvent.class,false);
        deserializer.addTrustedPackages("*");
        return  new DefaultKafkaConsumerFactory<>(
                Map.of(
                        ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG,bootstrapServers,
                        ConsumerConfig.GROUP_ID_CONFIG,"notification-group",
                        ConsumerConfig.AUTO_OFFSET_RESET_CONFIG,"earliest"
                ),new StringDeserializer(),deserializer
        );
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String,BookingEvent> kafkaListenerContainerFactory(){
        var factory=new ConcurrentKafkaListenerContainerFactory<String,BookingEvent>();
        factory.setConsumerFactory(consumerFactory());
        return factory;
    }
}

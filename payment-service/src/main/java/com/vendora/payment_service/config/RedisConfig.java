package com.vendora.payment_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {
    @Bean
    public RedisTemplate<String,String> redisTemplate(RedisConnectionFactory factory){
        RedisTemplate<String,String> template=new RedisTemplate<>();
        StringRedisSerializer s=new StringRedisSerializer();
        template.setKeySerializer(s);
        template.setHashValueSerializer(s);
        template.setHashKeySerializer(s);
        template.setHashValueSerializer(s);
        template.setConnectionFactory(factory);
        template.afterPropertiesSet();
        return template;
    }
}

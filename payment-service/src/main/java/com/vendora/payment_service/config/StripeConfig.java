package com.vendora.payment_service.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class StripeConfig {
    private final StripeProperties properties;

    @PostConstruct
    public void  init(){
        Stripe.apiKey=properties.getSecret();
    }
}

package com.vendora.auth_service.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "keycloak")
@Data
public class KeycloakProperties {
    private String serverUrl;

    private String realm;

    private String clientId;

    private String clientSecret;

}

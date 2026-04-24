package com.vendora.chat_service.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.security.Principal;
import java.util.Set;

@Slf4j
@Configuration
public class WebsocketAuthConfig implements WebSocketMessageBrokerConfigurer {

    // Roles allowed to connect to the WebSocket at all
    private static final Set<String> ALLOWED_ROLES = Set.of("USER", "PROVIDER", "ADMIN");

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {

            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(
                        message, StompHeaderAccessor.class);

                if (accessor == null) return message;

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {

                    // The API Gateway injected these STOMP headers from the JWT.
                    // The frontend must pass them as STOMP connect headers:
                    //   stompClient.connect({ login: userId, passcode: userRole, ... })
                    // or as custom headers: X-User-Id, X-User-Role
                    String userId = accessor.getFirstNativeHeader("X-User-Id");
                    String role   = accessor.getFirstNativeHeader("X-User-Role");

                    // Fallback: some STOMP clients use login/passcode
                    if (userId == null) userId = accessor.getLogin();
                    if (role   == null) role   = accessor.getPasscode();

                    if (userId == null || userId.isBlank()) {
                        log.warn("WebSocket CONNECT rejected — missing X-User-Id header");
                        // Returning null rejects the connection
                        return null;
                    }

                    if (role == null || !ALLOWED_ROLES.contains(role.toUpperCase())) {
                        log.warn("WebSocket CONNECT rejected — invalid role '{}' for user '{}'", role, userId);
                        return null;
                    }

                    final String finalUserId = userId.trim();

                    // Set the Principal so Spring can route /user/** destinations correctly.
                    // principal.getName() == userId is what SimpMessagingTemplate.convertAndSendToUser() uses.
                    accessor.setUser(new Principal() {
                        @Override
                        public String getName() { return finalUserId; }
                        @Override
                        public String toString() { return "WsPrincipal[" + finalUserId + "]"; }
                    });

                    log.debug("WebSocket CONNECT authenticated — userId={}, role={}", finalUserId, role);
                }

                return message;
            }
        });
    }
}
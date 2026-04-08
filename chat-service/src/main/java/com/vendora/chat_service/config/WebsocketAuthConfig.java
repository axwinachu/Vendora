package com.vendora.chat_service.config;

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

@Configuration
public class WebsocketAuthConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor= MessageHeaderAccessor.getAccessor(message,StompHeaderAccessor.class);
                if(accessor!=null && StompCommand.CONNECT.equals(accessor.getCommand())){

                    String userId=accessor.getLogin();

                    if (userId!=null && !userId.isBlank()){
                        accessor.setUser(new Principal() {
                            @Override
                            public String getName() {
                                return userId;
                            }
                        });
                    }

                }
                return message;
            }
        });
    }

}
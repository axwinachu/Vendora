package com.vendora.chat_service.controller;

import com.vendora.chat_service.dto.ChatMessageDTO;
import com.vendora.chat_service.facade.ChatFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatController {
    private final ChatFacade chatFacade;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessageDTO dto){
        chatFacade.handleSendMessage(dto);
    }
}

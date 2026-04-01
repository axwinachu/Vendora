package com.vendora.chat_service.controller;

import com.vendora.chat_service.facade.ChatFacade;
import com.vendora.chat_service.model.Message;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/message")
public class MessageController {
    private final ChatFacade chatFacade;
    @GetMapping("/{userId}/{providerId}")
    public List<Message> getMessage(@PathVariable String userId,@PathVariable String providerId){
        return chatFacade.getChatHistory(userId,providerId);
    }

}

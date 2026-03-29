package com.example.demo.controller;

import com.example.demo.model.Document;
import com.example.demo.payload.request.DocumentEditMessage;
import com.example.demo.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class CollaborationWsController {

    @Autowired
    private DocumentRepository documentRepository;

    @MessageMapping("/doc/{docId}/edit")
    @SendTo("/topic/doc/{docId}")
    public DocumentEditMessage handleEdit(@DestinationVariable Long docId,
                                          @Payload DocumentEditMessage editMessage,
                                          Principal principal) {
        // Log who made the change
        if (principal != null) {
            editMessage.setSender(principal.getName());
        }

        // DB saving has been delegated to the Frontend auto-debouncer calling `PUT /api/documents/{docId}/save`
        // so WebSockets merely act as the lightning-fast synchronizer buffer!

        // Broadcast to all subscribers on /topic/doc/{docId}
        return editMessage;
    }
}

package com.example.demo.payload.request;

import com.example.demo.model.DocumentType;

public class CreateDocumentRequest {
    private String title;
    private DocumentType type;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public DocumentType getType() { return type; }
    public void setType(DocumentType type) { this.type = type; }
}

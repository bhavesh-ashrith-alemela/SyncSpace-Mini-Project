package com.example.demo.payload.request;

public class DocumentEditMessage {
    private String sender;
    private String content;

    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}

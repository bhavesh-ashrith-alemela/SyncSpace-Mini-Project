package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    private DocumentType type;

    @Lob
    private String content;

    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "document_collaborators",
        joinColumns = @JoinColumn(name = "document_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> collaborators = new HashSet<>();

    public Document() {}

    public Document(String title, DocumentType type, String content, User owner) {
        this.title = title;
        this.type = type;
        this.content = content;
        this.owner = owner;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public DocumentType getType() { return type; }
    public void setType(DocumentType type) { this.type = type; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
    public Set<User> getCollaborators() { return collaborators; }
    public void setCollaborators(Set<User> collaborators) { this.collaborators = collaborators; }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Custom builder pattern
    public static DocumentBuilder builder() { return new DocumentBuilder(); }
    public static class DocumentBuilder {
        private String title;
        private DocumentType type;
        private String content;
        private User owner;
        public DocumentBuilder title(String title) { this.title = title; return this; }
        public DocumentBuilder type(DocumentType type) { this.type = type; return this; }
        public DocumentBuilder content(String content) { this.content = content; return this; }
        public DocumentBuilder owner(User owner) { this.owner = owner; return this; }
        public Document build() { return new Document(title, type, content, owner); }
    }
}

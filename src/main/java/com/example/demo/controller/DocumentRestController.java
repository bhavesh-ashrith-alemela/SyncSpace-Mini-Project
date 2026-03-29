package com.example.demo.controller;

import com.example.demo.model.Document;
import com.example.demo.model.User;
import com.example.demo.payload.request.CreateDocumentRequest;
import com.example.demo.repository.DocumentRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.example.demo.model.DocumentRevision;
import com.example.demo.repository.DocumentRevisionRepository;
import java.time.LocalDateTime;
import java.time.Duration;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/documents")
public class DocumentRestController {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DocumentRevisionRepository revisionRepository;

    @GetMapping
    public ResponseEntity<List<Document>> getAllDocuments() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(401).build();

        return ResponseEntity.ok(documentRepository.findDistinctByOwnerOrCollaboratorsContaining(currentUser, currentUser));
    }

    @PostMapping
    public ResponseEntity<?> createDocument(@RequestBody CreateDocumentRequest request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId()).orElse(null);

        if (currentUser == null) {
            return ResponseEntity.badRequest().body("Error: User not found");
        }

        Document document = Document.builder()
                .title(request.getTitle())
                .type(request.getType())
                .content(request.getType() == com.example.demo.model.DocumentType.PPT ? "[\"\"]" : "")
                .owner(currentUser)
                .build();

        Document savedDoc = documentRepository.save(document);
        return ResponseEntity.ok(savedDoc);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDocumentById(@PathVariable Long id) {
        return documentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/save")
    public ResponseEntity<?> saveDocumentContent(@PathVariable Long id, @RequestBody java.util.Map<String, String> payload) {
        String newContent = payload.get("content");
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId()).orElse(null);

        if (currentUser == null) return ResponseEntity.badRequest().body("Error: User not found");

        return documentRepository.findById(id).map(document -> {
            document.setContent(newContent);
            documentRepository.save(document);

            // Debounce Revision Saves: only save a new revision if the last revision was more than 30s ago
            var lastRevOpt = revisionRepository.findTopByDocumentOrderByEditedAtDesc(document);
            boolean shouldSaveRevision = true;
            if (lastRevOpt.isPresent()) {
                LocalDateTime lastTime = lastRevOpt.get().getEditedAt();
                if (Duration.between(lastTime, LocalDateTime.now()).getSeconds() < 30) {
                    shouldSaveRevision = false;
                }
            }

            if (shouldSaveRevision) {
                DocumentRevision revision = new DocumentRevision(document, currentUser, newContent);
                revisionRepository.save(revision);
            }

            return ResponseEntity.ok(document);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<?> getDocumentHistory(@PathVariable Long id) {
        return documentRepository.findById(id).map(document -> {
            List<DocumentRevision> history = revisionRepository.findByDocumentOrderByEditedAtDesc(document);
            return ResponseEntity.ok(history);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/invite")
    public ResponseEntity<?> inviteUser(@PathVariable Long id, @RequestBody java.util.Map<String, String> payload) {
        String usernameToInvite = payload.get("username");
        User targetUser = userRepository.findByUsername(usernameToInvite).orElse(null);
        
        if (targetUser == null) return ResponseEntity.badRequest().body("Error: User to invite not found");

        return documentRepository.findById(id).map(document -> {
            document.getCollaborators().add(targetUser);
            documentRepository.save(document);
            return ResponseEntity.ok("Successfully invited " + usernameToInvite);
        }).orElse(ResponseEntity.notFound().build());
    }
}

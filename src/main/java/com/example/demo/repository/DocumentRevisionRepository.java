package com.example.demo.repository;

import com.example.demo.model.Document;
import com.example.demo.model.DocumentRevision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRevisionRepository extends JpaRepository<DocumentRevision, Long> {
    List<DocumentRevision> findByDocumentOrderByEditedAtDesc(Document document);
    
    // Custom query to find the most recent revision for a document
    Optional<DocumentRevision> findTopByDocumentOrderByEditedAtDesc(Document document);
}

package com.example.demo.repository;

import com.example.demo.model.Document;
import com.example.demo.model.FileAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileAssetRepository extends JpaRepository<FileAsset, Long> {
    List<FileAsset> findByDocument(Document document);
}

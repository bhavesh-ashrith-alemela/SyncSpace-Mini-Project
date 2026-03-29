package com.example.demo.controller;

import com.example.demo.model.Document;
import com.example.demo.model.FileAsset;
import com.example.demo.model.User;
import com.example.demo.repository.DocumentRepository;
import com.example.demo.repository.FileAssetRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/documents/{id}/files")
public class FileUploadController {

    private final Path fileStorageLocation;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileAssetRepository fileAssetRepository;

    public FileUploadController() {
        this.fileStorageLocation = Paths.get("./uploads").toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            System.err.println("Could not create the directory where the uploaded files will be stored.");
        }
    }

    @PostMapping
    public ResponseEntity<?> uploadFile(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        Document document = documentRepository.findById(id).orElse(null);
        if (document == null) return ResponseEntity.notFound().build();

        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.findById(userDetails.getId()).orElse(null);

        String fileName = StringUtils.cleanPath(file.getOriginalFilename());

        try {
            Path targetLocation = this.fileStorageLocation.resolve(System.currentTimeMillis() + "_" + fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            FileAsset asset = new FileAsset(fileName, targetLocation.toString(), file.getContentType(), file.getSize(), document, currentUser);
            fileAssetRepository.save(asset);

            return ResponseEntity.ok(asset);
        } catch (IOException ex) {
            return ResponseEntity.internalServerError().body("Could not store file " + fileName + ". Please try again!");
        }
    }

    @GetMapping
    public ResponseEntity<List<FileAsset>> getFiles(@PathVariable Long id) {
        Document document = documentRepository.findById(id).orElse(null);
        if (document == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(fileAssetRepository.findByDocument(document));
    }

    @GetMapping("/{fileId}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id, @PathVariable Long fileId) {
        Document document = documentRepository.findById(id).orElse(null);
        if (document == null) return ResponseEntity.notFound().build();

        FileAsset asset = fileAssetRepository.findById(fileId).orElse(null);
        if (asset == null || !asset.getDocument().getId().equals(id)) return ResponseEntity.notFound().build();

        try {
            Path filePath = Paths.get(asset.getFilePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                String contentType = asset.getFileType() != null ? asset.getFileType() : "application/octet-stream";
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + asset.getFileName() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().build();
        }
    }
}

package com.example.provider_service.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    private static final List<String> ALLOWED_TYPE =
            Arrays.asList("image/jpeg", "image/png", "image/jpg", "image/webp");

    private static final long MAX_SIZE = 5 * 1024 * 1024;
    public void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty. Please select an image.");
        }
        if (!ALLOWED_TYPE.contains(file.getContentType())) {
            throw new RuntimeException("Only JPG, PNG and WEBP images are allowed.");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new RuntimeException("File size must be under 5MB.");
        }
    }

    // ── Profile photo upload ──────────────────────────────────────
    public String uploadProfilePhoto(MultipartFile file, String providerId) {
        validateFile(file);
        try {
            Transformation transformation = new Transformation()
                    .width(400).height(400)
                    .crop("fill").gravity("face")
                    .fetchFormat("auto").quality("auto");

            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder",         "vendora/providers/profiles",
                            "public_id",      "provider_" + providerId,
                            "overwrite",      true,
                            "invalidate",     true,
                            "transformation", transformation
                    )
            );
            String url = (String) result.get("secure_url");
            log.info("Profile photo uploaded for provider {}: {}", providerId, url);
            return url;
        } catch (Exception ex) {
            log.error("Profile upload failed for provider {}: {}", providerId, ex.getMessage());
            throw new RuntimeException("Profile upload failed: " + ex.getMessage());
        }
    }

    public String uploadPortfolioImage(MultipartFile file, String providerId) {
        validateFile(file);
        try {
            Transformation transformation = new Transformation()
                    .width(800).height(600)
                    .crop("fill")
                    .fetchFormat("auto").quality("auto");

            // unique ID so each portfolio image is stored separately
            String imageId = "portfolio_" + UUID.randomUUID();

            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder",         "vendora/providers/" + providerId + "/portfolio",
                            "public_id",      imageId,
                            "overwrite",      false,
                            "transformation", transformation
                    )
            );
            String url = (String) result.get("secure_url");
            log.info("Portfolio image uploaded for provider {}: {}", providerId, url);
            return url;
        } catch (Exception ex) {
            log.error("Portfolio upload failed for provider {}: {}", providerId, ex.getMessage());
            throw new RuntimeException("Portfolio upload failed: " + ex.getMessage());
        }
    }

    public void deleteProfilePhoto(String providerId) {
        try {
            cloudinary.uploader().destroy(
                    "vendora/providers/profiles/provider_" + providerId,
                    ObjectUtils.asMap("invalidate", true)   // FIXED: was missing folder path
            );
            log.info("Profile photo deleted for provider {}", providerId);
        } catch (Exception ex) {
            log.error("Profile photo delete failed for provider {}: {}", providerId, ex.getMessage());
            throw new RuntimeException("Profile photo deletion failed: " + ex.getMessage());
        }
    }

    public void deletePortfolioImage(String imageUrl) {
        try {
            String publicId = extractPublicId(imageUrl);  // FIXED: use URL not providerId
            cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.asMap("invalidate", true)  // FIXED: was "invalid"
            );
            log.info("Portfolio image deleted: {}", publicId);
        } catch (Exception ex) {
            log.error("Portfolio delete failed: {}", ex.getMessage());
            throw new RuntimeException("Portfolio image deletion failed: " + ex.getMessage());
        }
    }

    public String extractPublicId(String url) {
        int uploadIndex = url.indexOf("/upload/");
        String afterUpload = url.substring(uploadIndex + 8);
        if (afterUpload.startsWith("v") && afterUpload.contains("/")) {
            afterUpload = afterUpload.substring(afterUpload.indexOf("/") + 1);
        }
        return afterUpload.substring(0, afterUpload.lastIndexOf("."));
    }
}
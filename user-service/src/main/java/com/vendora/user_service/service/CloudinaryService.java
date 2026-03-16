package com.vendora.user_service.service;

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

@Service
@Slf4j
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    private static final List<String> ALLOWED_TYPE =
            Arrays.asList("image/jpeg", "image/jpg", "image/png", "image/webp");
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

    public String uploadProfilePhoto(MultipartFile file, String userId) {
        validateFile(file);
        try {
            Transformation transformation = new Transformation()
                    .width(400)
                    .height(400)
                    .crop("fill")
                    .gravity("face")
                    .quality("auto")
                    .fetchFormat("auto");

            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder",         "vendora/profiles",
                            "public_id",      "user_" + userId,
                            "overwrite",      true,
                            "invalidate",     true,
                            "transformation", transformation
                    )
            );

            String url = (String) result.get("secure_url");
            log.info("Profile photo uploaded for user {}: {}", userId, url);
            return url;

        } catch (Exception ex) {
            log.error("Cloudinary upload failed for user {}: {}", userId, ex.getMessage());
            throw new RuntimeException("Photo upload failed: " + ex.getMessage());
        }
    }

    public void deleteProfilePhoto(String userId) {
        try {
            cloudinary.uploader().destroy(
                    "vendora/profiles/user_" + userId,
                    ObjectUtils.asMap("invalidate", true)
            );
            log.info("Profile photo deleted for user {}", userId);
        } catch (Exception ex) {
            log.error("Cloudinary delete failed for user {}: {}", userId, ex.getMessage());
            throw new RuntimeException("Photo deletion failed: " + ex.getMessage());
        }
    }
}
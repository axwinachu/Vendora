package com.example.provider_service.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {
    private final Cloudinary cloudinary;

    private List<String> ALLOWED_TYPE= Arrays.asList("image/jpeg","image/png","image/jpg","image/webp");

    private final long MAX_SIZE=5*1024*1024;

    public void validateFile(MultipartFile file){
        if(file==null ||file.isEmpty()){
            throw new RuntimeException("file is not valid");
        }
        if (!ALLOWED_TYPE.contains(file.getContentType())){
            throw new RuntimeException("file type is Not valid");
        }
        if(MAX_SIZE<file.getSize()){
            throw new RuntimeException("fie size is too bigger");
        }
    }
    public String uploadProfilePhoto(MultipartFile file,String providerId){
        validateFile(file);
        Transformation transformation=new Transformation()
                .width(800).height(800)
                .crop("fill").gravity("face")
                .fetchFormat("auto").quality("auto");
        try {
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "vendora/providers/profiles",
                            "public_id", "provider_" + providerId,
                            "overwrite", true,
                            "invalidate", true,
                            "transformation", transformation
                    )
            );
            String url = (String) result.get("secure_url");
            log.info("Profile photo uploaded for provider {}: {}", providerId, url);
            return url;
        }catch (Exception ex){
            throw new RuntimeException("profile uploading failed"+ex.getMessage());
        }
    }
    public String UploadPortfolioImage(MultipartFile file,String providerId){
        validateFile(file);
        try{
        Transformation transformation=new Transformation()
                .width(800).height(800)
                .gravity("face").crop("fill")
                .fetchFormat("auto").quality("auto");

            Map<?,?> res=cloudinary.uploader().upload(file.getBytes(),ObjectUtils.asMap(
                    "folder", "vendora/providers/profiles",
                    "public_id", "provider_" + providerId,
                    "overwrite", true,
                    "invalidate", true,
                    "transformation", transformation
            ));
            String url=(String) res.get("secure_url");
            log.info("Portfolio image uploaded for provider {}: {}", providerId, url);
            return url;
        }catch (Exception ex){
            throw new RuntimeException("upload portfolio image failed");
        }

    }
    public void deleteProfilePhoto(String providerId){
        try {
            cloudinary.uploader().destroy("Provider_"+providerId,ObjectUtils.asMap("invalidate",true));
        } catch (Exception ex) {
            throw new RuntimeException(ex.getMessage());
        }
    }
    public void deletePortfolioImage(String providerId){
        try {
            cloudinary.uploader().destroy("Provider_"+providerId,
                    ObjectUtils.asMap("invalid",true));
            log.info("portfolio image providerId {} deleted",providerId);
        }catch (Exception ex){
            log.error("Portfolio delete failed: {}", ex.getMessage());
            throw new RuntimeException("delete portfolio image"+ex.getMessage());
        }
    }
    public  String extractProviderId(String url){
        int uploadIndex = url.indexOf("/upload/");
        String afterUpload = url.substring(uploadIndex + 8);
        if (afterUpload.startsWith("v") && afterUpload.contains("/")) {
            afterUpload = afterUpload.substring(afterUpload.indexOf("/") + 1);
        }
        return afterUpload.substring(0, afterUpload.lastIndexOf("."));
    }
}

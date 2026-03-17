package com.example.provider_service.facade;

import com.example.provider_service.dto.CreateProviderRequest;
import com.example.provider_service.dto.ProviderResponse;
import com.example.provider_service.dto.UpdateProviderRequest;
import com.example.provider_service.enums.District;
import com.example.provider_service.enums.ProviderStatus;
import com.example.provider_service.enums.ServiceCategory;
import com.example.provider_service.mapper.ProviderMapper;
import com.example.provider_service.model.Provider;
import com.example.provider_service.service.CloudinaryService;
import com.example.provider_service.service.ProviderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class ProviderFacade {
    private final CloudinaryService cloudinaryService;
    private final ProviderMapper providerMapper;
    private final ProviderService providerService;

    public ProviderResponse createProviderRequest(CreateProviderRequest request) {
        if(providerService.existsByUserId(request.getUserId())){
            throw new RuntimeException("Provider profile already exists for the userId");
        }
        Provider provider=Provider.builder()
                .userId(request.getUserId())
                .businessName(request.getBusinessName())
                .description(request.getDescription())
                .serviceCategory(request.getServiceCategory())
                .district(request.getDistrict())
                .address(request.getAddress())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .experienceYears(request.getExperienceYears())
                .basePrice(request.getBasePrice())
                .priceUnit(request.getPriceUnit())
                .status(ProviderStatus.PENDING)
                .isAvailable(true)
                .build();
        return providerMapper.toResponse(providerService.save(provider));
    }
    public ProviderResponse getProviderById(String id) {
        return providerMapper.toResponse(providerService.findById(id));
    }

    public ProviderResponse getProviderByUserId(String userId) {
        return providerMapper.toResponse(providerService.findByUserId(userId));
    }


    public List<ProviderResponse> getAllProviders() {
        return providerService.findAll().stream().map(providerMapper::toResponse).toList();
    }

    public List<ProviderResponse> getByDistrict(District district) {
        return providerService.findByDistrict(district).stream().map(providerMapper::toResponse).toList();
    }

    public List<ProviderResponse> getByCategory(ServiceCategory category) {
        return providerService.getByServiceCategory(category).stream().map(providerMapper::toResponse).toList();
    }

    public List<ProviderResponse> getByDistrictAndCategory(District district, ServiceCategory category) {
        return providerService.findByDistrictAndCategory(district,category).stream().map(providerMapper::toResponse).toList();
    }

    public List<ProviderResponse> getTopRated(District district,ServiceCategory category) {
        return providerService.findTopRatedByDistrict(district,category).stream().map(providerMapper::toResponse).toList();
    }

    public List<ProviderResponse> getNearByProviders(double lat, double lng, double radiusKm, District district, ServiceCategory category) {
        return providerService.findNearByProviders(lat,lng,radiusKm,district,category).stream().map(providerMapper::toResponse).toList();
    }

    public ProviderResponse updateProvider(String id, UpdateProviderRequest request) {
        Provider provider=providerService.findById(id);
        if(Objects.nonNull(request.getBusinessName())) provider.setBusinessName(request.getBusinessName());
        if(Objects.nonNull(request.getDescription())) provider.setDescription(request.getDescription());
        if (Objects.nonNull(request.getServiceCategory())) provider.setServiceCategory(request.getServiceCategory());
        if (Objects.nonNull(request.getDistrict())) provider.setDistrict(request.getDistrict());
        if (Objects.nonNull(request.getAddress())) provider.setAddress(request.getAddress());
        if (Objects.nonNull(request.getLatitude())) provider.setLatitude(request.getLatitude());
        if (Objects.nonNull(request.getLongitude())) provider.setLongitude(request.getLongitude());
        if (Objects.nonNull(request.getExperienceYears())) provider.setExperienceYears(request.getExperienceYears());
        if (Objects.nonNull(request.getBasePrice())) provider.setBasePrice(request.getBasePrice());
        if (Objects.nonNull(request.getPriceUnit())) provider.setPriceUnit(request.getPriceUnit());
        if (Objects.nonNull(request.getIsAvailable())) provider.setIsAvailable(request.getIsAvailable());
        return providerMapper.toResponse(providerService.save(provider));
    }

    public ProviderResponse updateStatus(String id, ProviderStatus status) {
        return providerMapper.toResponse(providerService.updateStatus(id,status));
    }

    public ProviderResponse toggleAvailability(String id) {
        return providerMapper.toResponse(providerService.findById(id));
    }

    public ProviderResponse uploadProfilePhoto(String id, MultipartFile file) {
        Provider provider=providerService.findById(id);
        String url=cloudinaryService.uploadProfilePhoto(file,id);
        provider.setProfilePhotoUrl(url);
        return providerMapper.toResponse(providerService.save(provider));
    }

    public ProviderResponse removeProfilePhoto(String id) {
        Provider provider=providerService.findById(id);
        if(Objects.isNull(provider.getProfilePhotoUrl())){
            throw new RuntimeException("Profile photo not found"+id);
        }
        cloudinaryService.deleteProfilePhoto(id);
        provider.setProfilePhotoUrl(null);
        return providerMapper.toResponse(providerService.save(provider));
    }

    public ProviderResponse uploadPortfolioImage(String id, MultipartFile file) {
        Provider provider=providerService.findById(id);
        List<String> images=providerService.getPortfolioList(provider);
        if(images.size()>10){
            throw new RuntimeException("Maximum 10 images are allowed");
        }
        String url=cloudinaryService.UploadPortfolioImage(file,id);
        images.add(url);
        provider.setPortfolioImages(providerService.buildPortfolioString(images));
        return providerMapper.toResponse(providerService.save(provider));
    }

    public ProviderResponse removePortfolioImage(String id, String imageUrl) {
        Provider provider=providerService.findById(id);
        List<String> images=providerService.getPortfolioList(provider);
        if(!images.contains(imageUrl)){
            throw new RuntimeException("image url was not found");
        }
        cloudinaryService.deletePortfolioImage(imageUrl);
        images.remove(imageUrl);
        return providerMapper.toResponse(providerService.save(provider));
    }

    public void updateRating(String id, double rating) {
        providerService.updateRating(id, rating);
    }

    public void deleteProvider(String id) {
        Provider provider = providerService.findById(id);
        if (provider.getProfilePhotoUrl() != null) {
            cloudinaryService.deleteProfilePhoto(id);
        }
        providerService.getPortfolioList(provider)
                .forEach(cloudinaryService::deletePortfolioImage);
        providerService.delete(provider);

    }
}

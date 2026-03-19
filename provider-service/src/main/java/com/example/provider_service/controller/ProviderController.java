package com.example.provider_service.controller;

import com.example.provider_service.dto.CreateProviderRequest;
import com.example.provider_service.dto.ProviderResponse;
import com.example.provider_service.dto.UpdateProviderRequest;
import com.example.provider_service.enums.District;
import com.example.provider_service.enums.ProviderStatus;
import com.example.provider_service.enums.ServiceCategory;
import com.example.provider_service.facade.ProviderFacade;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/provider")
public class ProviderController {

    private final ProviderFacade providerFacade;

    @PostMapping("/create")
    public ProviderResponse createProvider(
            @Valid @RequestBody CreateProviderRequest request) {
        return providerFacade.createProviderRequest(request);
    }

    @GetMapping("/{id}")
    public ProviderResponse getById(@PathVariable String id) {
        return providerFacade.getProviderById(id);
    }

    @GetMapping("/user/{userId}")
    public ProviderResponse getByUserId(@PathVariable String userId) {
        return providerFacade.getProviderByUserId(userId);
    }

    @GetMapping("/all")
    public List<ProviderResponse> getAll() {
        return providerFacade.getAllProviders();
    }

    @GetMapping("/district/{district}")
    public List<ProviderResponse> getByDistrict(@PathVariable District district) {
        return providerFacade.getByDistrict(district);
    }

    @GetMapping("/category/{category}")
    public List<ProviderResponse> getByCategory(@PathVariable ServiceCategory category) {
        return providerFacade.getByCategory(category);
    }

    @GetMapping("/district/{district}/category/{category}")
    public List<ProviderResponse> getByDistrictAndCategory(
            @PathVariable District district,
            @PathVariable ServiceCategory category) {
        return providerFacade.getByDistrictAndCategory(district, category);
    }

    @GetMapping("/top-rated/{district}")
    public List<ProviderResponse> getTopRated(
            @PathVariable District district,
            @RequestParam(required = false) ServiceCategory category) {  // FIXED: @RequestParam not @PathVariable
        return providerFacade.getTopRated(district, category);
    }

    @GetMapping("/nearby")
    public List<ProviderResponse> getNearBy(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "20") double radiusKm,
            @RequestParam District district,
            @RequestParam(required = false) ServiceCategory category) {
        return providerFacade.getNearbyProviders(lat, lng, radiusKm, district, category);
    }

    @PutMapping("/{id}")
    public ProviderResponse update(
            @PathVariable String id,
            @Valid @RequestBody UpdateProviderRequest request) {
        return providerFacade.updateProvider(id, request);
    }

    @PatchMapping("/{id}/status")
    public ProviderResponse updateStatus(
            @PathVariable String id,
            @RequestParam ProviderStatus status) {
        return providerFacade.updateStatus(id, status);
    }

    @PatchMapping("/{id}/availability")
    public ProviderResponse toggleAvailability(@PathVariable String id) {
        return providerFacade.toggleAvailability(id);
    }

    @PostMapping(value = "/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProviderResponse uploadPhoto(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file) {
        return providerFacade.uploadProfilePhoto(id, file);
    }

    @DeleteMapping("/{id}/photo")
    public ProviderResponse removePhoto(@PathVariable String id) {
        return providerFacade.removeProfilePhoto(id);
    }

    @PostMapping(value = "/{id}/portfolio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProviderResponse uploadPortfolio(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file) {
        return providerFacade.uploadPortfolioImage(id, file);
    }

    @DeleteMapping("/{id}/portfolio")
    public ProviderResponse removePortfolio(
            @PathVariable String id,
            @RequestParam String imageUrl) {
        return providerFacade.removePortfolioImage(id, imageUrl);
    }

    @PatchMapping("/{id}/rating")
    public void updateRating(
            @PathVariable String id,
            @RequestParam double rating) {
        providerFacade.updateRating(id, rating);
    }

    @DeleteMapping("/{id}")
    public void deleteProvider(@PathVariable String id) {
        providerFacade.deleteProvider(id);

    }
}

package com.example.provider_service.service;

import com.example.provider_service.enums.District;
import com.example.provider_service.enums.ProviderStatus;
import com.example.provider_service.enums.ServiceCategory;
import com.example.provider_service.model.Provider;
import com.example.provider_service.repository.ProviderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.aspectj.apache.bcel.classfile.Module;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProviderService {
    private final ProviderRepository providerRepository;

    public Provider save(Provider provider){
        return providerRepository.save(provider);
    }

    public boolean existsByUserId(String userId){
        return providerRepository.existsByUserId(userId);
    }

    public Provider findById(String id){
        return providerRepository.findById(id)
                .orElseThrow(()->new RuntimeException("provider id no found"+id));
    }

    public Provider findByUserId(String userId){
        return providerRepository.findByUserId(userId)
                .orElseThrow(()->new RuntimeException("no provider in the userID"));

    }

    public List<Provider> findAll(){
        return providerRepository.findAll();
    }

    public List<Provider> findByDistrict(District district){
        return providerRepository.findByDistrict(district);
    }

    public List<Provider> findByDistrictAndCategory(District district, ServiceCategory category){
        return providerRepository.findByDistrictAndServiceCategory(district,category);
    }

    public List<Provider> findTopRatedByDistrict(District district,ServiceCategory category){
        return providerRepository.findByDistrictAndStatusOrderByAverageRatingDesc(district, ProviderStatus.APPROVED);
    }

    public List<Provider> findNearByProviders(double lat,double lng,double radius,
                                              District district,ServiceCategory category){
        String categoryStr=category!=null? category.name() : null;
        return providerRepository.findNearbyProviders(lat,lng,radius,district.name(),categoryStr);
    }

    public Provider updateStatus(String id,ProviderStatus status){
        Provider provider=findById(id);
        provider.setStatus(status);
        log.info("Provider {} status updated to {}",id,status);
        return providerRepository.save(provider);
    }

    public Provider toggleAvailability(String id){
        Provider provider=findById(id);
        provider.setIsAvailable(!provider.getIsAvailable());
        return  providerRepository.save(provider);
    }

    public void updateRating(String id,double newRating){
        Provider provider=findById(id);
        int total=provider.getTotalReviews()+1;
        double avg=((provider.getAverageRating()*provider.getTotalReviews())+newRating)/total;
        provider.setTotalReviews(total);
        provider.setAverageRating(Math.round(avg*10.0)/10.0);
        providerRepository.save(provider);
        log.info("Rating updated for provider {} : {}",id,avg);
    }

    public void delete(Provider provider){
        providerRepository.delete(provider);
    }

    public List<String> getPortfolioList(Provider provider){
        if(provider.getPortfolioImages()==null || provider.getPortfolioImages().isBlank()){
            return new ArrayList<>();
        }
        return new ArrayList<>(Arrays.asList(provider.getPortfolioImages().split(",")));
    }

    public String buildPortfolioString(List<String> images){
        return images.isEmpty()?null:String.join(",",images);
    }

    public double calculateDistance(double lat1, double lng1,
                                    double lat2, double lng2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    public List<Provider> getByServiceCategory(ServiceCategory category){
        return providerRepository.findByServiceCategory(category);
    }

    public List<Provider> getByProviderStatus(ProviderStatus status){
        return providerRepository.findByStatus(status);
    }
}

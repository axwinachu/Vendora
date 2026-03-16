package com.vendora.user_service.service;

import com.vendora.user_service.dto.UpdateLocationRequest;
import com.vendora.user_service.enums.District;
import com.vendora.user_service.model.User;
import com.vendora.user_service.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User save(User user){
        return userRepository.save(user);
    }

    public boolean existsByEmail(String email){
        return userRepository.existsByEmail(email);
    }

    public User findById(String id){
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User findByEmail(String email){
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found"));
    }

    public List<User> findAll(){
        return userRepository.findAll();
    }

    public List<User> findByDistrict(District district){
        return userRepository.findByDistrict(district);
    }

    public void delete(User user){
        userRepository.delete(user);
    }
    @Transactional
    public User updateLocationByGps(String id, UpdateLocationRequest request) {
        User user = findById(id);

        if (request.getDistrict() != District.COIMBATORE
                && request.getDistrict() != District.PALAKKAD) {
            throw new RuntimeException(
                    "Vendora is available only in Coimbatore and Palakkad.");
        }

        user.setLatitude(request.getLatitude());
        user.setLongitude(request.getLongitude());
        user.setDistrict(request.getDistrict());
        return userRepository.save(user);
    }

    // NEW — Address: GeocodingService converts address → lat/lng
    @Transactional
    public User updateLocationByAddress(String id, GeocodeingService.GeoResult geoResult) {
        User user = findById(id);
        user.setLatitude(geoResult.latitude());
        user.setLongitude(geoResult.longitude());
        user.setDistrict(District.valueOf(geoResult.district()));
        return userRepository.save(user);
    }
}
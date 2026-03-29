package com.vendora.user_service.facade;

import com.vendora.user_service.dto.CreateUserRequest;
import com.vendora.user_service.dto.GeocodeAddressRequest;
import com.vendora.user_service.dto.UpdateLocationRequest;
import com.vendora.user_service.dto.UserResponse;
import com.vendora.user_service.enums.District;
import com.vendora.user_service.exception.EmailAlreadyRegisterException;
import com.vendora.user_service.exception.ProfileUploadingException;
import com.vendora.user_service.mapper.UserMapper;
import com.vendora.user_service.model.User;
import com.vendora.user_service.service.CloudinaryService;
import com.vendora.user_service.service.GeocodeingService;
import com.vendora.user_service.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Component
@RequiredArgsConstructor
public class UserFacade {

        private final UserService userService;
        private final UserMapper userMapper;
        private final CloudinaryService cloudinaryService;
        private final GeocodeingService geocodeingService;
        public UserResponse createUser(CreateUserRequest request){

            if(userService.existsByEmail(request.getEmail())){
                throw new EmailAlreadyRegisterException("Email already registered");
            }

            User user = User.builder()
                    .userName(request.getUserName())
                    .email(request.getEmail())
                    .phone(request.getPhone())
                    .district(request.getDistrict())
                    .active(true)
                    .build();

            User saved = userService.save(user);

            return userMapper.toResponse(saved);
        }

        public UserResponse getUserById(String id){
            User user = userService.findById(id);
            return userMapper.toResponse(user);
        }

        public UserResponse getUserByEmail(String email){
            User user = userService.findByEmail(email);
            return userMapper.toResponse(user);
        }

        public List<UserResponse> getAllUsers(){
            return userService.findAll()
                    .stream()
                    .map(userMapper::toResponse)
                    .toList();
        }

        public List<UserResponse> getUserByDistrict(District district){
            return userService.findByDistrict(district)
                    .stream()
                    .map(userMapper::toResponse)
                    .toList();
        }
    public UserResponse uploadProfilePhoto(String id, MultipartFile file){

        User user = userService.findById(id);
        try {
            String imageUrl = cloudinaryService.uploadProfilePhoto(file, id);

            user.setProfilePhotoUrl(imageUrl);

            User updated = userService.save(user);

            return userMapper.toResponse(updated);
        }catch (Exception ex){
            throw new ProfileUploadingException("Profile uploading exception"+ex.getMessage());
        }
    }
    // NEW — GPS: frontend sends lat/lng directly
    public UserResponse updateLocationByGps(String id,
                                            UpdateLocationRequest request) {
        User updated = userService.updateLocationByGps(id, request);
        return userMapper.toResponse(updated);
    }

    // NEW — Address: user types address → geocode → store lat/lng
    public UserResponse updateLocationByAddress(String id,
                                                GeocodeAddressRequest request) {
        GeocodeingService.GeoResult geoResult =
                geocodeingService.geocode(request.getAddress());
        User updated = userService.updateLocationByAddress(id, geoResult);
        return userMapper.toResponse(updated);
    }

    public UserResponse getOrCreateUser(String userId, String email) {
           User user=userService.findByIdOptional(userId)
                    .orElseGet(()->User.builder()
                            .id(userId)
                            .userName(email)
                            .active(true)
                            .email(email)
                            .build());

           return userMapper.toResponse(userService.save(user));
    }
}

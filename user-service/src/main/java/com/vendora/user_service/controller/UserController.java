package com.vendora.user_service.controller;

import com.vendora.user_service.dto.CreateUserRequest;
import com.vendora.user_service.dto.GeocodeAddressRequest;
import com.vendora.user_service.dto.UpdateLocationRequest;
import com.vendora.user_service.dto.UserResponse;
import com.vendora.user_service.enums.District;
import com.vendora.user_service.facade.UserFacade;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {
    private final UserFacade userFacade;

    @PostMapping("/create")
    public UserResponse createUser(@RequestBody CreateUserRequest request){
        return userFacade.createUser(request);
    }
    @GetMapping("/{id}")
    public UserResponse getUserById(@PathVariable String id){
        return userFacade.getUserById(id);
    }
    @GetMapping("/email/{email}")
    public UserResponse getUserByEmail(@PathVariable String email){
        return userFacade.getUserByEmail(email);
    }
    @GetMapping("/all")
    public List<UserResponse> getAllUsers(){
        return userFacade.getAllUsers();
    }
    @GetMapping("/district/{district}")
    public List<UserResponse> getAllUserByDistrict(@PathVariable District district){
        return userFacade.getUserByDistrict(district);
    }
    @PostMapping(value = "/{id}/photo",consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserResponse uploadPhoto(@PathVariable String id, @RequestParam("file")MultipartFile file){
        return userFacade.uploadProfilePhoto(id,file);
    }
    @PatchMapping("/{id}/location/gps")
    public UserResponse updateLocationByGps(
            @PathVariable String id,
            @Valid @RequestBody UpdateLocationRequest request) {
        return userFacade.updateLocationByGps(id, request);
    }

    // NEW — Address: user types their address, backend geocodes it
    // PATCH /user/{id}/location/address
    @PatchMapping("/{id}/location/address")
    public UserResponse updateLocationByAddress(
            @PathVariable String id,
            @Valid @RequestBody GeocodeAddressRequest request) {
        return userFacade.updateLocationByAddress(id, request);
    }
}

package com.vendora.auth_service.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;


@Data
@AllArgsConstructor
public class SearchRequest {
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    @Min(0)
    private int first=0;
    @Min(1)
    @Max(100)
    private int max=20;

}

package com.example.provider_service.repository;

import com.example.provider_service.enums.District;
import com.example.provider_service.enums.ProviderStatus;
import com.example.provider_service.enums.ServiceCategory;
import com.example.provider_service.model.Provider;
import jdk.jfr.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProviderRepository extends JpaRepository<Provider,String> {

    Optional<Provider> findByUserId(String userId);

    boolean existsByUserId(String userId);

    List<Provider> findByDistrict(District district);

    List<Provider> findByServiceCategory(ServiceCategory category);

    List<Provider> findByProviderStatus(ProviderStatus status);

    List<Provider> findBYDistrictAndServiceCategory(District district,ServiceCategory serviceCategory);

    List<Provider> findByDistrictAndStatusOrderByAverageRatingDesc(
            District district, ProviderStatus status);


    @Query(value = """
            SELECT * FROM providers
            WHERE district     = :district
              AND status       = 'APPROVED'
              AND is_available = true
              AND (:category   IS NULL OR service_category = :category)
            HAVING (
                6371 * ACOS(
                    COS(RADIANS(:lat)) * COS(RADIANS(latitude)) *
                    COS(RADIANS(longitude) - RADIANS(:lng)) +
                    SIN(RADIANS(:lat)) * SIN(RADIANS(latitude))
                )
            ) <= :radiusKm
            ORDER BY (
                6371 * ACOS(
                    COS(RADIANS(:lat)) * COS(RADIANS(latitude)) *
                    COS(RADIANS(longitude) - RADIANS(:lng)) +
                    SIN(RADIANS(:lat)) * SIN(RADIANS(latitude))
                )
            ) ASC
            """, nativeQuery = true)
    List<Provider> findNearbyProviders(
            @Param("lat")      double lat,
            @Param("lng")      double lng,
            @Param("radiusKm") double radiusKm,
            @Param("district") String district,
            @Param("category") String category
    );
}



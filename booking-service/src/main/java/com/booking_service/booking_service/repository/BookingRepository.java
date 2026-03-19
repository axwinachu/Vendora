package com.booking_service.booking_service.repository;

import com.booking_service.booking_service.enums.BookingStatus;
import com.booking_service.booking_service.model.Booking;
import org.springframework.stereotype.Repository;

import java.awt.print.Book;
import java.util.List;

@Repository
public interface BookingRepository {
    List<Booking> findByCustomerId(String customerId);

    List<Booking> findByProviderId(String providerId);

    List<Booking> findByCustomerIdAndStatus(String customerId, BookingStatus status);

    List<Booking> findByProviderIdAndStatus(String providerId,BookingStatus status);

    List<Booking> findByCustomerIdOrderByCreatedAtDesc(String customerID);

    List<Booking> findByProviderIdOrderByCreatedAtDesc(String providerId);

    boolean existsByCustomerIdAndProviderIdAndStatus(
            String customerId,String providerId,BookingStatus status
    );

}

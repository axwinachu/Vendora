package com.booking_service.booking_service.service;

import com.booking_service.booking_service.enums.BookingStatus;
import com.booking_service.booking_service.model.Booking;
import com.booking_service.booking_service.repository.BookingRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {
    private final BookingRepository bookingRepository;

    public Booking save(Booking booking){
        return bookingRepository.save(booking);
    }

    public Booking findById(String id){
        return bookingRepository.findById(id)
                .orElseThrow(()->new RuntimeException("Booking not found"));
    }

    public List<Booking> findByCustomerId(String customerId){
        return bookingRepository.findByCustomerId(customerId);
    }

    public List<Booking> findByProviderId(String providerId){
        return bookingRepository.findByProviderId(providerId);
    }

    public List<Booking> findAll(){
        return bookingRepository.findAll();
    }
    private void validateStatus(Booking booking, BookingStatus required,String message){
        if(booking.getStatus()!= required){
            throw new RuntimeException(message);
        }
    }
    @Transactional
    public Booking confirm(String bookingId,String providerEmail){
        Booking booking=findById(bookingId);
        validateStatus(booking,BookingStatus.PENDING,"Only pending booking can be confirmed");
        booking.setStatus(BookingStatus.CONFIRMED);
        log.info("Booking {} confirmed by {}",bookingId,providerEmail);
        return bookingRepository.save(booking);
    }
    @Transactional
    public Booking rejected(String bookingId,String providerEmail){
        Booking booking=findById(bookingId);
        validateStatus(booking,BookingStatus.PENDING,"Only pending bookings can be rejected.");
        booking.setStatus(BookingStatus.REJECTED);
        log.info("Booking {} rejected by {}",bookingId,providerEmail);
        return bookingRepository.save(booking);
    }
    @Transactional
    public Booking start(String bookingId){
        Booking booking=findById(bookingId);
        validateStatus(booking,BookingStatus.CONFIRMED,"only Confirmed booking can be started");
        booking.setStatus(BookingStatus.IN_PROGRESS);
        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking complete(String bookingId){
        Booking booking=findById(bookingId);
        validateStatus(booking,BookingStatus.IN_PROGRESS,"Only IN_PROGRESS booking can be completed.");
        booking.setStatus(BookingStatus.COMPLETED);
        return  bookingRepository.save(booking);
    }

    @Transactional
    public Booking cancel(String bookingId,String canceledBy,String reason){
        Booking booking =findById(bookingId);
        if(booking.getStatus()==BookingStatus.COMPLETED || booking.getStatus()==BookingStatus.PAID){
            throw new RuntimeException("Completed or paid bookings cannot be cancelled.");
        }
        booking.setStatus(BookingStatus.CANCELED);
        booking.setCancelledBy(canceledBy);
        booking.setCancellationReason(reason);
        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking markPaid(String bookingId){
        Booking booking=findById(bookingId);
        validateStatus(booking,BookingStatus.COMPLETED,"only Completed booking can be marked as paid");
        booking.setStatus(BookingStatus.PAID);
        return bookingRepository.save(booking);
    }
}

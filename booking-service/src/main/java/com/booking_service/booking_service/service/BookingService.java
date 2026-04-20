package com.booking_service.booking_service.service;

import com.booking_service.booking_service.enums.BookingStatus;
import com.booking_service.booking_service.exception.BookingNotFoundException;
import com.booking_service.booking_service.exception.InvalidBookingStatusException;
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

    public Booking save(Booking booking) {
        return bookingRepository.save(booking);
    }

    public Booking findById(String id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with id: " + id));
    }

    public List<Booking> findByCustomerId(String customerId) {
        return bookingRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    public List<Booking> findByProviderId(String providerId) {
        return bookingRepository.findByProviderIdOrderByCreatedAtDesc(providerId);
    }

    public List<Booking> findAll() {
        return bookingRepository.findAll();
    }

    private void validateStatus(Booking booking, BookingStatus required, String message) {
        // Using equals() is fine for enums but more explicit and consistent
        if (!required.equals(booking.getStatus())) {
            throw new InvalidBookingStatusException(message);
        }
    }
    public List<Booking> findByStatus(BookingStatus status){
        return bookingRepository.findByStatus(status);
    }
    public List<Booking> saveAll(List<Booking> bookings){
        return bookingRepository.saveAll(bookings);
    }

    @Transactional
    public Booking confirm(String bookingId, String providerEmail) {
        Booking booking = findById(bookingId);
        validateStatus(booking, BookingStatus.PENDING, "Only PENDING bookings can be confirmed.");
        booking.setStatus(BookingStatus.CONFIRMED);
        log.info("Booking {} confirmed by {}", bookingId, providerEmail);
        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking rejected(String bookingId, String providerEmail) {
        Booking booking = findById(bookingId);
        validateStatus(booking, BookingStatus.PENDING, "Only PENDING bookings can be rejected.");
        booking.setStatus(BookingStatus.REJECTED);
        log.info("Booking {} rejected by {}", bookingId, providerEmail);
        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking start(String bookingId) {
        Booking booking = findById(bookingId);
        validateStatus(booking, BookingStatus.CONFIRMED, "Only CONFIRMED bookings can be started.");
        booking.setStatus(BookingStatus.IN_PROGRESS);
        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking complete(String bookingId) {
        Booking booking = findById(bookingId);
        validateStatus(booking, BookingStatus.IN_PROGRESS, "Only IN_PROGRESS bookings can be completed.");
        booking.setStatus(BookingStatus.COMPLETED);
        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking cancel(String bookingId, String cancelledBy, String reason) {
        Booking booking = findById(bookingId);

        // FIX: Added CANCELED and REJECTED to the guard — previously those statuses could be re-cancelled
        BookingStatus current = booking.getStatus();
        if (current == BookingStatus.COMPLETED
                || current == BookingStatus.PAID
                || current == BookingStatus.CANCELED
                || current == BookingStatus.REJECTED) {
            throw new InvalidBookingStatusException(
                    "Booking with status " + current + " cannot be cancelled.");
        }

        booking.setStatus(BookingStatus.CANCELED);
        booking.setCancelledBy(cancelledBy);
        booking.setCancellationReason(reason);
        log.info("Booking {} cancelled by {} — reason: {}", bookingId, cancelledBy, reason);
        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking markPaid(String bookingId) {
        Booking booking = findById(bookingId);
        validateStatus(booking, BookingStatus.COMPLETED, "Only COMPLETED bookings can be marked as paid.");
        booking.setStatus(BookingStatus.PAID);
        return bookingRepository.save(booking);
    }
}
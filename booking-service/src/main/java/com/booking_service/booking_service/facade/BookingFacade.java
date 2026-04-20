package com.booking_service.booking_service.facade;

import com.booking_service.booking_service.dto.BookingResponse;
import com.booking_service.booking_service.dto.CreateBookingRequest;
import com.booking_service.booking_service.dto.ProviderResponse;
import com.booking_service.booking_service.enums.BookingStatus;
import com.booking_service.booking_service.event.BookingEvent;
import com.booking_service.booking_service.feign.ProviderServiceClient;
import com.booking_service.booking_service.feign.UserServiceClient;
import com.booking_service.booking_service.model.Booking;
import com.booking_service.booking_service.service.BookingService;
import com.booking_service.booking_service.service.KafkaProducerService;
import com.booking_service.booking_service.service.OtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingFacade {
    private final KafkaProducerService kafkaProducerService;
    private final BookingService bookingService;
    private final UserServiceClient userServiceClient;
    private final ProviderServiceClient providerServiceClient;
    private final OtpService otpService;

    //helper
    private BookingEvent toEvent(Booking booking,String eventType){
        var customer=userServiceClient.getUserById(booking.getCustomerId());
        var provider=providerServiceClient.getProviderById(booking.getProviderId());
        return BookingEvent.builder()
                .bookingId(booking.getId())
                .customerId(booking.getCustomerId())
                .customerEmail(customer.getEmail())
                .customerName(customer.getName())
                .providerId(booking.getProviderId())
                .providerEmail(provider.getEmail())
                .providerName(provider.getBusinessName())
                .status(booking.getStatus())
                .serviceCategory(booking.getServiceCategory())
                .scheduledDate(booking.getScheduledDate())
                .scheduledTime(booking.getScheduledTime())
                .eventType(eventType)
                .address(booking.getAddress())
                .cancellationDetails(booking.getCancellationReason())
                .build();
    }
    private  BookingResponse toResponse(Booking booking){
        return BookingResponse.builder()
                .id(booking.getId())
                .customerId(booking.getCustomerId())
                .providerId(booking.getProviderId())
                .serviceCategory(booking.getServiceCategory())
                .scheduledDate(booking.getScheduledDate())
                .scheduledTime(booking.getScheduledTime())
                .address(booking.getAddress())
                .notes(booking.getNotes())
                .basePrice(booking.getBasePrice())
                .status(booking.getStatus())
                .cancelledBy(booking.getCancelledBy())
                .cancellationReason(booking.getCancellationReason())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }

    public BookingResponse createBooking(CreateBookingRequest request,String customerId){
        ProviderResponse provider=providerServiceClient
                .getProviderById(request.getProviderId());
        if (!Boolean.TRUE.equals(provider.getIsAvailable())){
            throw new RuntimeException("provider id currently unavailable.");
        }
        if(!"APPROVED".equals(provider.getStatus())){
            throw new RuntimeException("Provider is not approved.");
        }
        Booking booking=Booking.builder()
                .customerId(customerId)
                .providerId(request.getProviderId())
                .serviceCategory(request.getServiceCategory())
                .scheduledDate(request.getScheduledDate())
                .scheduledTime(request.getScheduledTime())
                .address(request.getAddress())
                .notes(request.getNotes())
                .basePrice(provider.getBasePrice())
                .status(BookingStatus.PENDING)
                .build();
        Booking saved=bookingService.save(booking);
        kafkaProducerService.publishBookingCreated(toEvent(saved,"booking.created"));
        log.info("booking created: {}",saved.getId());
        return toResponse(saved);
    }
    public BookingResponse getBookingById(String id){
        return toResponse(bookingService.findById(id));
    }

    public List<BookingResponse> getMyBookings(String userId,String role){
        List<Booking> bookings;
        if("PROVIDER".equals((role))){
            bookings=bookingService.findByProviderId(userId);
        }else{
            bookings=bookingService.findByCustomerId(userId);
        }
        return bookings.stream().map(this::toResponse).toList();
    }
    public List<BookingResponse> getAllBookings(){
        return bookingService.findAll().stream().map(this::toResponse).toList();
    }

    public BookingResponse confirm(String bookingId,String providerEmail){
        Booking booking=bookingService.confirm(bookingId,providerEmail);
        kafkaProducerService.publishBookingConfirmed(toEvent(booking,"booking.confirmed"));
        return toResponse(booking);
    }
    public BookingResponse rejected(String bookingId,String providerEmail){
        Booking booking=bookingService.rejected(bookingId,providerEmail);
        kafkaProducerService.publishBookingCancelled(toEvent(booking,"booking.rejected"));
        return toResponse(booking);
    }
    public BookingResponse start(String bookingId){

        return toResponse(bookingService.start(bookingId));
    }
    public BookingResponse complete(String bookingId){
        Booking booking=bookingService.findById(bookingId);

        if(!BookingStatus.IN_PROGRESS.equals(booking.getStatus())){
            throw new RuntimeException("Booking must be in progress");
        }
        String otp= otpService.generateOtp(bookingId);

        booking.setStatus(BookingStatus.WAITING_FOR_OTP);

        Booking saved=bookingService.save(booking);
        BookingEvent event=toEvent(saved,"booking.otp.generated");
        event.setCancellationDetails(otp);

        kafkaProducerService.publishBookingCompleted(event);
        return toResponse(booking);
    }
    public BookingResponse cancel(String bookingId,String cancelledBy,String reason){
        Booking booking=bookingService.cancel(bookingId,cancelledBy,reason);
        kafkaProducerService.publishBookingCancelled(toEvent(booking,"booking.cancelled"));
        return toResponse(booking);
    }
    public BookingResponse markPaid(String bookingId){
        return toResponse(bookingService.markPaid(bookingId));
    }
    public BookingResponse verifyOtp(String bookingId,String otp){
        Booking booking=bookingService.findById(bookingId);

        if(!BookingStatus.WAITING_FOR_OTP.equals(booking.getStatus())){
            throw new RuntimeException("Booking not waiting for otp");
        }
        otpService.verifyOtp(bookingId,otp);

        booking.setStatus(BookingStatus.COMPLETED);

        Booking saved=bookingService.save(booking);

        kafkaProducerService.publishBookingCompleted(toEvent(saved,"booking.completed"));
        return toResponse(saved);
    }
}

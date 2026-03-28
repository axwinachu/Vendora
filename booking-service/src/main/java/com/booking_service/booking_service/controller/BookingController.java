package com.booking_service.booking_service.controller;

import com.booking_service.booking_service.dto.BookingResponse;
import com.booking_service.booking_service.dto.CancelRequest;
import com.booking_service.booking_service.dto.CreateBookingRequest;
import com.booking_service.booking_service.facade.BookingFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/booking")
public class BookingController {
    private final BookingFacade bookingFacade;
    @PostMapping("/create")
    public BookingResponse createBooking(@RequestBody CreateBookingRequest request, @RequestHeader("X-User-Id") String customerId){
        return bookingFacade.createBooking(request,customerId);
    }
    @GetMapping("/my")
    public List<BookingResponse> getMyBookings(@RequestHeader("X-User-Id") String userId,@RequestHeader("X-User-Role") String role){
        return bookingFacade.getMyBookings(userId,role);
    }
    @GetMapping("/all")
    public List<BookingResponse> getAllBookings(){
        return bookingFacade.getAllBookings();
    }
    @PatchMapping("/{id}/confirm")
    public BookingResponse confirm(@PathVariable String id,@RequestHeader("X-User-Email") String providerEmail){
        return bookingFacade.confirm(id,providerEmail);
    }
    @PatchMapping("/{id}/reject")
    public BookingResponse reject(@PathVariable String id,@RequestHeader("X-User-Email") String providerEmail){
        return bookingFacade.rejected(id,providerEmail);
    }
    @PatchMapping("/{id}/complete")
    public BookingResponse complete(@PathVariable String id){
        return bookingFacade.complete(id);
    }
    @PatchMapping("/{id}/cancel")
    public BookingResponse cancel(@PathVariable String id, @RequestHeader("X-User-Role") String role, @RequestBody CancelRequest cancelRequest){
        String reason=cancelRequest.getReason();
        return bookingFacade.cancel(id,role,reason);
    }
    @PatchMapping("/{id}/paid")
    public BookingResponse markPaid(@PathVariable String id){
        return bookingFacade.markPaid(id);
    }
}

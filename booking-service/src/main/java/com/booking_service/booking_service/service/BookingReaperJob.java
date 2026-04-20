package com.booking_service.booking_service.service;

import com.booking_service.booking_service.enums.BookingStatus;
import com.booking_service.booking_service.model.Booking;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingReaperJob {
    private final BookingService bookingService;
    private final RedisTemplate<String,String> redisTemplate;

    @Scheduled(fixedRate = 60_000)
    @SchedulerLock(name = "revertExpiredOtpBookings",lockAtMostFor = "PT2M")
    public void revertExpiredOtpBookings(){
        List<Booking> waitingBookings=bookingService.findByStatus(BookingStatus.WAITING_FOR_OTP);

        if(waitingBookings.isEmpty()){
            log.debug("Reaper job: no WAITING_FOR_OTP booking found.");
            return;
        }
        log.info("Reaper job : found {} WAITING_FOR_BOOKING Checking otp keys..",waitingBookings.size());

        List<Booking> expiredOtpBookings=waitingBookings.stream()
                .filter(booking -> {
                    String redisKey="booking:otp:"+booking.getId();
                    Boolean keyExists=redisTemplate.hasKey(redisKey);
                    return Boolean.FALSE.equals(keyExists);
                }).toList();
        if(expiredOtpBookings.isEmpty()){
            log.debug("Reaper job:all WAITING_FOR_OTP bookings still have active OTPs");
            return;
        }
        expiredOtpBookings.forEach(booking -> {
            booking.setStatus(BookingStatus.IN_PROGRESS);
            log.warn("Reaper: booking {} reverted WAITING_FOR_OTP -> IN_PROGRESS",booking.getId());
        });
        bookingService.saveAll(expiredOtpBookings);
        log.info("Reaper job :successfully reverted {} bookings(s) to IN_PROGRESS",expiredOtpBookings.size());
    }
}

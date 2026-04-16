package com.vendora.payment_service.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.Security;
import java.util.List;

@Component
@Slf4j
public class HeadAuthFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String email=request.getHeader("X-User-Email");
        String userId=request.getHeader("X-User-Id");
        String role=request.getHeader("X-User-Role");
        log.info("userId {} email {} role {}",userId,email,role);
        if(userId!=null && role!=null && SecurityContextHolder.getContext().getAuthentication()==null){
            log.info(">>> Building auth for role: ROLE_{}", role);

            UsernamePasswordAuthenticationToken auth=new UsernamePasswordAuthenticationToken(userId,null, List.of(new SimpleGrantedAuthority("ROLE_"+role)));
            SecurityContextHolder.getContext().setAuthentication(auth);
            log.info(">>> Auth set: {}", SecurityContextHolder.getContext().getAuthentication().getAuthorities());
        }else{
            log.warn(">>> Auth NOT set — userId: {}, role: {}, existingAuth: {}", userId, role, SecurityContextHolder.getContext().getAuthentication());
        }
        filterChain.doFilter(request, response);
    }
}

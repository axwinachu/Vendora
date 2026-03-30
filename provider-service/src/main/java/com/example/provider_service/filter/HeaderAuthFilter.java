package com.example.provider_service.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

@Slf4j
@Component
public class HeaderAuthFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String email=request.getHeader("X-User-Email");
        String role=request.getHeader("X-User-Role");
        String userId=request.getHeader("X-User-Id");
        if(Objects.nonNull(email) && Objects.nonNull(role)
                && Objects.isNull(SecurityContextHolder.getContext().getAuthentication())){
            UsernamePasswordAuthenticationToken auth=new UsernamePasswordAuthenticationToken(email,null, List.of(new SimpleGrantedAuthority("ROLE_"+role)));
            SecurityContextHolder.getContext().setAuthentication(auth);
            log.debug("Auth set for {} role {} userId {}", email, role,userId);

        }
        filterChain.doFilter(request,response);
    }
}

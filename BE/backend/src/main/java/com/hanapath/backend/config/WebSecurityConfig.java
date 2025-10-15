package com.hanapath.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class WebSecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf().disable()
                .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/users/signup", "/api/users/login", "/api/users/check-email", "/api/users/check-phone", "/api/users/check-nickname").permitAll()
                        .requestMatchers("/api/news/recent", "/api/news/*").permitAll() 
                        .requestMatchers("/api/news/*/reward").authenticated()  
                        .requestMatchers("/api/store/products/**").permitAll() 
                        .requestMatchers("/api/store/purchase/**").authenticated()
                        .requestMatchers("/api/store/purchase-history/**").authenticated() 
                        .requestMatchers("/api/store/gifticons/**").authenticated()
                        .requestMatchers("/api/stock/**").permitAll() 
                        .requestMatchers("/api/investment/performance/**").authenticated() 
                        .requestMatchers("/api/investment/**").authenticated() 
                        .requestMatchers("/api/investment-account/**").authenticated() 
                        .requestMatchers("/api/hanamoney/**").authenticated()
                        .requestMatchers("/api/attendance/**").authenticated() 
                        .requestMatchers("/api/quiz/**").authenticated() 
                        .requestMatchers("/api/chatbot/**").authenticated() 
                        .requestMatchers("/api/community/**").authenticated() 
                        .requestMatchers("/api/savings/**").authenticated() 
                        .requestMatchers("/api/allowance-schedules/**").authenticated() 
                        .requestMatchers("/api/wallet/**").authenticated() 
                        .requestMatchers("/ws/**").permitAll()        
                        .requestMatchers("/api/users/**").authenticated()
                        .anyRequest().permitAll()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
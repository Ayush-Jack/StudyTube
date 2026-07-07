package com.studytube.config;

import com.studytube.common.util.AppConstants;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Security configuration — JWT filter wired, routes locked down.
 * Public: auth endpoints, GET videos/channels, actuator health.
 * Protected: everything else (requires valid Bearer token).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    // ── Public GET endpoints (no auth needed) ────────────────────
    private static final String[] PUBLIC_GET = {
            AppConstants.Api.VIDEOS + "/**",
            AppConstants.Api.CHANNELS + "/**",
            "/actuator/health",
    };

    // ── Public ANY-method endpoints ──────────────────────────────
    private static final String[] PUBLIC_ANY = {
            AppConstants.Api.AUTH + "/**",
            "/oauth2/**",
            "/error",
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // CORS — use our CorsConfig bean
            .cors(cors -> cors.configurationSource(corsConfigurationSource))

            // Disable CSRF — stateless JWT, no cookies
            .csrf(AbstractHttpConfigurer::disable)

            // Stateless session — no server-side sessions
            .sessionManagement(sm ->
                sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Return 401 JSON instead of Spring's default 403 page
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write(
                        "{\"success\":false,\"message\":\"Unauthorized — please log in\",\"status\":401}"
                    );
                })
            )

            // Authorization rules
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(PUBLIC_ANY).permitAll()
                .requestMatchers(HttpMethod.GET, PUBLIC_GET).permitAll()
                // Everything else requires authentication
                .anyRequest().authenticated()
            )

            // Wire JWT filter before Spring's UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}

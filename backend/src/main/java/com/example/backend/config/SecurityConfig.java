package com.example.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import com.example.backend.filter.JWTAuthenticationFilter; // 【新增】导入 JWT 过滤器
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter; // 【新增】用于指定过滤器位置
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // --- 1. 定义全局 CORS 配置 ---
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // 允许所有来源进行跨域访问
        configuration.setAllowedOriginPatterns(List.of("*"));
        // 允许所有方法（GET, POST, etc.）
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        // 允许所有头文件
        configuration.setAllowedHeaders(List.of("*"));
        // 允许携带认证信息（如 JWT Token）
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // 对所有路径生效
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    // --- 2. 配置 Spring Security 过滤器链 ---
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                // 1. 启用我们自定义的 CORS 配置
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 2. 禁用 CSRF
                .csrf(csrf -> csrf.disable())

                // 3. 【核心修改】添加 JWT 过滤器
                // 在 UsernamePasswordAuthenticationFilter 之前执行我们的 JWT 过滤器
                // 这样所有请求到达业务逻辑之前，都会先通过 JWT 检查
                .addFilterBefore(new JWTAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)

                // 4. 配置授权规则
                .authorizeHttpRequests(authorize -> authorize
                        // 所有 OPTIONS 请求（CORS 预检请求）必须放行
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/uploads/**").permitAll()

                        // 【重要】除了 WebSecurityCustomizer 忽略的路径，所有其他请求都需要认证
                        .anyRequest().authenticated()
                );

        // 禁用 Spring Security 默认的登录和基本认证
        http.formLogin(form -> form.disable());
        http.httpBasic(httpBasic -> httpBasic.disable());

        return http.build();
    }
}
package com.example.backend.filter;

import com.example.backend.utils.JWTUtils;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * JWT 认证过滤器：在所有受保护的 API 之前执行，用于验证 Token
 */
public class JWTAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. 从 Header 中获取 Token (格式: Authorization: Bearer <token>)
        String header = request.getHeader("Authorization");

        // 检查 Header 是否存在且格式正确
        if (header == null || !header.startsWith("Bearer ")) {
            // 如果没有 Token，直接放行，交给后续的 Spring Security 过滤器处理 (默认是拒绝访问)
            filterChain.doFilter(request, response);
            return;
        }

        // 2. 提取 Token
        String token = header.substring(7);

        // 3. 解析和验证 Token
        Claims claims = JWTUtils.parseToken(token);

        if (claims != null) {
            // Token 有效，提取用户信息 (user ID 在 JWTUtils 中是以 Long 类型存储的)
            Long userId = claims.get("userId", Long.class);
            String role = claims.get("role", String.class);

            // 4. 将用户信息设置到 Spring Security 上下文中
            if (userId != null) {
                // 创建用户的权限列表 (Spring Security 要求角色以 "ROLE_" 开头)
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);

                // 创建 Spring Security 认证对象 (Principal: userId, Credentials: null, Authorities: 角色)
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userId, null, Collections.singletonList(authority));

                // 将认证信息存入上下文，表示当前用户已通过认证，允许访问受保护资源
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        // 5. 继续过滤器链
        filterChain.doFilter(request, response);
    }
}
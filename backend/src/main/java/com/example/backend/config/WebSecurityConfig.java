package com.example.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;

@Configuration
public class WebSecurityConfig {

    /**
     * WebSecurityCustomizer 允许我们忽略 Spring Security 过滤器链，
     * 用于静态资源和公共接口，以确保它们不会被任何安全规则拦截。
     */
    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring().requestMatchers(
                // 【核心】明确忽略这些公共路径，让它们绕过整个安全检查
                "/api/user/login",
                "/api/user/register",
                "/api/user/hello",
//                "/api/image/**", // 暂时也忽略图片接口
                "/uploads/**"     // 【新增这一行】放行刚刚配置的静态图片资源
        );
    }
}
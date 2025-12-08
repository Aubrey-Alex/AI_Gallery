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
                // 明确忽略这些公共路径，让它们绕过整个安全检查
                "/uploads/**"    // 放行刚刚配置的静态图片资源
//                "/api/user/login",
//                "/api/user/register",
//                "/api/user/hello"
//                "/api/image/**", // 暂时忽略图片接口
//                "/api/tag/**" // 暂时放行 Tag 接口，方便调试
        );
    }
}
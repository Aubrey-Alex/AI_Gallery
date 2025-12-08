package com.example.backend.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public class JWTUtils {
    // 1. 定义秘钥
    // 为了安全，HS512 算法要求秘钥至少 64 个字节。
    // 这里我们把字符串转为 Key 对象。字符串太短，可能会报错。
    private static final String SECRET_STRING = "ai_gallery_secret_key_zju_cs_very_long_security_key_for_hs512_algorithm";
    private static final SecretKey KEY = Keys.hmacShaKeyFor(SECRET_STRING.getBytes(StandardCharsets.UTF_8));

    // 过期时间：7天
    private static final long EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000;

    /**
     * 生成 JWT Token (适配 0.12.5)
     */
    public static String generateToken(Long userId, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("role", role);

        return Jwts.builder()
                .claims(claims) // 设置自定义载荷
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME)) // 设置过期时间
                .signWith(KEY) // 使用 Key 对象签名，自动识别算法
                .compact();
    }

    /**
     * 解析 JWT Token (适配 0.12.5)
     */
    public static Claims parseToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(KEY) // 设置验签的 Key
                    .build()         // 构建解析器
                    .parseSignedClaims(token) // 解析 Token
                    .getPayload();   // 获取载荷
        } catch (Exception e) {
            // 解析失败（过期或篡改），返回 null
            return null;
        }
    }
}
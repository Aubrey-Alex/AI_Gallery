package com.example.backend.controller;

import com.example.backend.entity.ImageInfo;
import com.example.backend.service.ImageService;
import com.example.backend.utils.JWTUtils; // 假设你需要解析Token获取用户ID，或者直接从SecurityContext获取
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/image")
@CrossOrigin
public class ImageController {

    @Autowired
    private ImageService imageService;

    /**
     * 图片上传接口
     * URL: POST /api/image/upload
     * Content-Type: multipart/form-data
     */
    @PostMapping("/upload")
    public Map<String, Object> upload(@RequestParam("file") MultipartFile file) {
        Map<String, Object> result = new HashMap<>();
        try {
            // 1. 获取当前登录用户 ID
            // 我们的 JWTAuthenticationFilter 已经把 userId 放入了 Authentication 的 principal 中
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            Long userId = (Long) authentication.getPrincipal();

            // 2. 调用 Service 处理上传
            ImageInfo imageInfo = imageService.uploadImage(file, userId);

            // 3. 返回成功结果
            result.put("code", 200);
            result.put("msg", "上传成功");
            result.put("data", imageInfo); // 返回图片信息（包含访问路径）

        } catch (Exception e) {
            e.printStackTrace();
            result.put("code", 500);
            result.put("msg", "上传失败: " + e.getMessage());
        }
        return result;
    }
}
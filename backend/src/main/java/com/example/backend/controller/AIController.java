package com.example.backend.controller;

import com.example.backend.entity.ImageInfo;
import com.example.backend.service.AIService;
import com.example.backend.service.ImageService;
import com.example.backend.service.TagService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin
public class AIController {

    @Autowired
    private ImageService imageService;

    @Autowired
    private AIService aiService;

    @Autowired
    private TagService tagService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    /**
     * 手动触发 AI 分析
     * POST /api/ai/analyze
     */
    @PostMapping("/analyze")
    public Map<String, Object> analyze(@RequestBody Map<String, Long> request) {
        Map<String, Object> result = new HashMap<>();
        Long imageId = request.get("imageId");

        try {
            // 1. 查图片信息
            ImageInfo image = imageService.getById(imageId);
            if (image == null) throw new RuntimeException("图片不存在");

            // 2. 获取物理路径 (使用缩略图以节省流量)
            String thumbName = image.getThumbnailPath().replace("/uploads/", "");
            String absolutePath = Paths.get(uploadDir).resolve(thumbName).toString();

            // 3. 调用百度 AI
            List<String> aiTags = aiService.detectImageTags(absolutePath);

            // 4. 存入数据库 (Type = 2)
            if (!aiTags.isEmpty()) {
                tagService.addTags(List.of(imageId), aiTags, 2);
            }

            result.put("code", 200);
            result.put("msg", "分析完成");
            result.put("data", Map.of("tags", aiTags));

        } catch (Exception e) {
            e.printStackTrace();
            result.put("code", 500);
            result.put("msg", "AI 分析失败: " + e.getMessage());
        }
        return result;
    }
}
package com.example.backend.controller;

import com.example.backend.entity.ImageInfo;
import com.example.backend.service.ImageService;
import com.example.backend.service.MCPService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/mcp")
public class MCPController {

    @Autowired
    private MCPService mcpService;
    @Autowired
    private ImageService imageService;

    // 前端传参 DTO
    public static class SearchRequest {
        public String query;
    }

    @PostMapping("/search")
    public Map<String, Object> search(@RequestBody SearchRequest request) {
        // 1. 获取向量搜索结果 (ID + 分数)
        List<MCPService.SearchResult> searchResults = mcpService.searchImageByText(request.query);

        if (searchResults.isEmpty()) {
            return Map.of("code", 200, "data", Collections.emptyList());
        }

        // 2. 提取 ID 列表去查详细信息
        List<Long> ids = searchResults.stream().map(r -> r.id).collect(Collectors.toList());
        List<ImageInfo> images = imageService.listByIds(ids);

        // 3. 组装结果：把 ImageInfo 和 Score 拼在一起
        // 变成前端好用的格式: { ...imageInfo, score: 0.85 }
        List<Map<String, Object>> finalResult = new ArrayList<>();

        // 转 Map 方便查找
        Map<Long, ImageInfo> imageMap = images.stream()
                .collect(Collectors.toMap(ImageInfo::getId, img -> img));

        for (MCPService.SearchResult r : searchResults) {
            ImageInfo img = imageMap.get(r.id);
            if (img != null) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", img.getId());
                item.put("url", img.getFilePath()); // 注意：前端可能需要完整URL
                item.put("thumbnail", img.getThumbnailPath());
                item.put("score", r.score); // 核心：把分数给前端
                finalResult.add(item);
            }
        }

        return Map.of("code", 200, "msg", "success", "data", finalResult);
    }
}
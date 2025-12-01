package com.example.backend.controller;

import com.example.backend.service.TagService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.example.backend.entity.TagVO; // 记得导入
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/tag")
@CrossOrigin
public class TagController {

    @Autowired
    private TagService tagService;

    // 定义接收前端参数的内部类 DTO
    static class AddTagRequest {
        public List<Long> imageIds; // 选中的图片 ID 数组
        public List<String> tags;   // 输入的标签名数组
    }

    /**
     * 批量打标签接口
     * POST /api/tag/batch-add
     */
    @PostMapping("/batch-add")
    public Map<String, Object> batchAddTags(@RequestBody AddTagRequest request) {
        Map<String, Object> result = new HashMap<>();
        try {
            tagService.addTags(request.imageIds, request.tags);

            result.put("code", 200);
            result.put("msg", "标签添加成功");
        } catch (Exception e) {
            e.printStackTrace();
            result.put("code", 500);
            result.put("msg", "添加失败: " + e.getMessage());
        }
        return result;
    }

    /**
     * 获取当前用户的标签统计列表
     * GET /api/tag/list
     */
    @GetMapping("/list")
    public Map<String, Object> getUserTags() {
        Map<String, Object> result = new HashMap<>();
        try {
            // 获取当前用户
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            Long userId = (Long) authentication.getPrincipal();

            List<TagVO> tagList = tagService.getUserTagStats(userId);

            result.put("code", 200);
            result.put("msg", "获取成功");
            result.put("data", tagList);
        } catch (Exception e) {
            e.printStackTrace();
            result.put("code", 500);
            result.put("msg", "获取失败");
        }
        return result;
    }
}
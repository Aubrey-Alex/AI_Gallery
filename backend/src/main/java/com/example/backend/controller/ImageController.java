package com.example.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.backend.entity.ImageInfo;
import com.example.backend.entity.ImageVO;
import com.example.backend.service.ImageService;
import com.example.backend.service.TagService; // 【新增】用于查询标签
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/image")
@CrossOrigin
public class ImageController {

    @Autowired
    private ImageService imageService;

    @Autowired
    private TagService tagService; // 【新增】注入 TagService

    @Autowired
    private com.example.backend.mapper.ImageMetadataMapper metadataMapper; // 【新增注入】

    // 定义一个内部类用于接收 JSON 参数
    static class SaveEditorRequest {
        public String base64;
    }

    /**
     * 图片上传接口
     */
    @PostMapping("/upload")
    public Map<String, Object> upload(@RequestParam("file") MultipartFile file,
                                      @RequestParam(value = "shootTime", required = false) Long shootTime
    ) {
        Map<String, Object> result = new HashMap<>();
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            Long userId = (Long) authentication.getPrincipal();

            ImageInfo imageInfo = imageService.uploadImage(file, userId, shootTime);

            result.put("code", 200);
            result.put("msg", "上传成功");
            result.put("data", imageInfo);

        } catch (Exception e) {
            e.printStackTrace();
            result.put("code", 500);
            result.put("msg", "上传失败: " + e.getMessage());
        }
        return result;
    }

    /**
     * 获取当前用户的图片列表 (包含标签)
     * URL: GET /api/image/list
     */
    // 【修改】列表接口，增加 onlyFavorites 参数
    @GetMapping("/list")
    public Map<String, Object> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean onlyFavorites // 【新增】
    ) {
        Map<String, Object> result = new HashMap<>();
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            Long userId = (Long) authentication.getPrincipal();

            // 调用修改后的 searchImages
            List<ImageInfo> list = imageService.searchImages(userId, keyword, onlyFavorites);

            // ... (下面保持不变：转 VO，填标签，填 Metadata) ...
            List<ImageVO> voList = list.stream().map(img -> {
                ImageVO vo = new ImageVO();
                vo.setId(img.getId());
                vo.setUserId(img.getUserId());
                vo.setFilePath(img.getFilePath());
                vo.setThumbnailPath(img.getThumbnailPath());
                vo.setUploadTime(img.getUploadTime());
                // 【新增】VO 也得加上 isFavorite 字段，别忘了在 ImageVO 里也加一下！
                vo.setIsFavorite(img.getIsFavorite());

                vo.setTags(tagService.getTagsByImageId(img.getId()));
                vo.setMetadata(metadataMapper.selectById(img.getId()));
                return vo;
            }).collect(Collectors.toList());

            result.put("code", 200);
            result.put("msg", "获取成功");
            result.put("data", voList);

        } catch (Exception e) {
            e.printStackTrace();
            result.put("code", 500);
            result.put("msg", "获取失败: " + e.getMessage());
        }
        return result;
    }

    // 【新增】切换收藏状态接口
    @PostMapping("/{id}/favorite")
    public Map<String, Object> toggleFavorite(@PathVariable Long id) {
        Map<String, Object> result = new HashMap<>();
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            Long userId = (Long) authentication.getPrincipal();

            imageService.toggleFavorite(id, userId);

            result.put("code", 200);
            result.put("msg", "操作成功");
        } catch (Exception e) {
            e.printStackTrace();
            result.put("code", 500);
            result.put("msg", "操作失败: " + e.getMessage());
        }
        return result;
    }

    /**
     * 删除图片
     * DELETE /api/image/{id}
     */
    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        Map<String, Object> result = new HashMap<>();
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            Long userId = (Long) authentication.getPrincipal();

            imageService.deleteImage(id, userId);

            result.put("code", 200);
            result.put("msg", "删除成功");
        } catch (Exception e) {
            e.printStackTrace();
            result.put("code", 500);
            result.put("msg", "删除失败: " + e.getMessage());
        }
        return result;
    }

    /**
     * 保存编辑后的图片
     * POST /api/image/save-edited
     */
    @PostMapping("/save-edited")
    public Map<String, Object> saveEdited(@RequestBody SaveEditorRequest request) {
        Map<String, Object> result = new HashMap<>();
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            Long userId = (Long) authentication.getPrincipal();

            // 调用 Service 保存
            ImageInfo newImage = imageService.saveEditedImage(userId, request.base64);

            result.put("code", 200);
            result.put("msg", "保存成功");
            result.put("data", newImage);

        } catch (Exception e) {
            e.printStackTrace();
            result.put("code", 500);
            result.put("msg", "保存失败: " + e.getMessage());
        }
        return result;
    }
}
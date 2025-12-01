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
    public Map<String, Object> upload(@RequestParam("file") MultipartFile file) {
        Map<String, Object> result = new HashMap<>();
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            Long userId = (Long) authentication.getPrincipal();

            ImageInfo imageInfo = imageService.uploadImage(file, userId);

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
    @GetMapping("/list")
    public Map<String, Object> list(@RequestParam(required = false) String keyword) {
        Map<String, Object> result = new HashMap<>();
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            Long userId = (Long) authentication.getPrincipal();

//            QueryWrapper<ImageInfo> queryWrapper = new QueryWrapper<>();
//            queryWrapper.eq("user_id", userId);
//            queryWrapper.orderByDesc("upload_time");
//
//            List<ImageInfo> list = imageService.list(queryWrapper);
            // 这里的逻辑是：如果 tag 有值，Service 内部会去查关联表；如果没值，它会自动查全部。
            List<ImageInfo> list = imageService.searchImages(userId, keyword);

            // 【核心修改】将 ImageInfo 转换为 ImageVO 并填充标签
            List<ImageVO> voList = list.stream().map(img -> {
                ImageVO vo = new ImageVO();
                // 复制属性
                vo.setId(img.getId());
                vo.setUserId(img.getUserId());
                vo.setFilePath(img.getFilePath());
                vo.setThumbnailPath(img.getThumbnailPath());
                vo.setUploadTime(img.getUploadTime());

                // 查标签并填充
                vo.setTags(tagService.getTagsByImageId(img.getId()));
                // 2. 【新增】填充元数据
                // MyBatis-Plus 的 selectById 可以直接查主键
                vo.setMetadata(metadataMapper.selectById(img.getId()));
                return vo;
            }).collect(Collectors.toList());

            result.put("code", 200);
            result.put("msg", "获取成功");
            result.put("data", voList); // 返回新的 voList

        } catch (Exception e) {
            e.printStackTrace();
            result.put("code", 500);
            result.put("msg", "获取失败: " + e.getMessage());
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
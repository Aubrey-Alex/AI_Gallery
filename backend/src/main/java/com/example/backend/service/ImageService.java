package com.example.backend.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import com.drew.metadata.exif.GpsDirectory; // 【新增】GPS
import com.example.backend.entity.ImageInfo;
import com.example.backend.entity.ImageMetadata;
import com.example.backend.mapper.ImageInfoMapper;
import com.example.backend.mapper.ImageMetadataMapper;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.example.backend.entity.ImageTag;
import com.example.backend.entity.ImageTagRelation;
import com.example.backend.mapper.ImageTagMapper;
import com.example.backend.mapper.ImageTagRelationMapper;

import javax.imageio.ImageIO; // 【新增】读取宽高
import java.awt.image.BufferedImage; // 【新增】读取宽高
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.Base64;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.UUID;

@Service
public class ImageService extends ServiceImpl<ImageInfoMapper, ImageInfo> {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Autowired
    private ImageMetadataMapper metadataMapper;

    @Autowired
    private ImageTagMapper tagMapper;

    @Autowired
    private ImageTagRelationMapper relationMapper;

    @Autowired
    private TagService tagService; // 【核心修复 1】注入 TagService

    @Autowired
    private AIService aiService; // 【新增注入】

    @Transactional(rollbackFor = Exception.class)
    public ImageInfo uploadImage(MultipartFile file, Long userId) throws IOException {
        // 1. 准备路径
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // 2. 生成唯一文件名
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.lastIndexOf(".") > 0) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String extLower = extension.toLowerCase();

        String uuid = UUID.randomUUID().toString();
        String newFileName = uuid + extension;
        String thumbnailName = uuid + "_thumb" + extension;

        // 3. 保存原图
        Path targetLocation = uploadPath.resolve(newFileName);
        file.transferTo(targetLocation.toFile());

        // 4. 生成缩略图 (智能降级)
        Path thumbLocation = uploadPath.resolve(thumbnailName);
        try {
            if (extLower.contains("avif") || extLower.contains("webp") || extLower.contains("gif")) {
                throw new RuntimeException("Format not supported");
            }
            Thumbnails.of(targetLocation.toFile())
                    .size(600, 1000)
                    .outputQuality(0.8)
                    .toFile(thumbLocation.toFile());
        } catch (Exception e) {
            Files.deleteIfExists(thumbLocation);
            Files.copy(targetLocation, thumbLocation);
        }

        // 5. 提取 EXIF 信息
        ImageMetadata metaInfo = null;
        try {
            metaInfo = extractMetadata(targetLocation.toFile());
        } catch (Exception e) {
            System.err.println("EXIF 提取失败: " + e.getMessage());
        }

        // 6. 保存 ImageInfo 到数据库
        ImageInfo imageInfo = new ImageInfo();
        imageInfo.setUserId(userId);
        imageInfo.setFilePath("/uploads/" + newFileName);
        imageInfo.setThumbnailPath("/uploads/" + thumbnailName);
        imageInfo.setUploadTime(LocalDateTime.now());

        this.save(imageInfo);

        // 7. 保存 Metadata 并自动打标 (整合 EXIF 和 AI)
        if (metaInfo != null) {
            metaInfo.setImageId(imageInfo.getId());
            metadataMapper.insert(metaInfo);

            // === 自动打标逻辑 (整合版) ===
            List<String> autoTags = new ArrayList<>(); // 只定义一次！

            // A. EXIF 标签 (Type 3)
            if (metaInfo.getCameraModel() != null) {
                autoTags.add(metaInfo.getCameraModel().split(" ")[0]);
            }
            if (metaInfo.getShootTime() != null) {
                autoTags.add(String.valueOf(metaInfo.getShootTime().getYear()));
            }
            // 立即保存 EXIF 标签
            if (!autoTags.isEmpty()) {
                tagService.addTags(List.of(imageInfo.getId()), autoTags, 3);
            }
        }
        // B. AI 智能分析 (Type 2)
        // 注意：这里我们用 try-catch 包裹 AI 调用，防止 AI 报错影响图片上传主流程
        try {
            // 1. 检查文件格式，如果是 AVIF/WebP 等不支持的格式，直接跳过 AI 识别
            if (extension.toLowerCase().contains("avif") || extension.toLowerCase().contains("webp")) {
                System.out.println("跳过 AI 识别：格式不支持 (" + extension + ")");
            } else {
                // 2. 只有支持的格式才调用百度 AI
                String absolutePath = thumbLocation.toString();
                System.out.println("开始调用百度AI，图片路径: " + absolutePath);

                List<String> aiTags = aiService.detectImageTags(absolutePath);

                if (!aiTags.isEmpty()) {
                    System.out.println("AI 识别成功，标签: " + aiTags);
                    tagService.addTags(List.of(imageInfo.getId()), aiTags, 2);
                }
            }
        } catch (Exception e) {
            System.err.println("AI 识别跳过: " + e.getMessage());
        }

        return imageInfo;
    }

    // 辅助方法：提取 EXIF (增强版：支持宽高和GPS)
    private ImageMetadata extractMetadata(File file) {
        ImageMetadata info = new ImageMetadata();
        try {
            // 1. 读取基础宽高
            BufferedImage bimg = ImageIO.read(file);
            if (bimg != null) {
                info.setWidth(bimg.getWidth());
                info.setHeight(bimg.getHeight());
            }

            // 2. 读取 EXIF 标签
            Metadata metadata = ImageMetadataReader.readMetadata(file);

            ExifIFD0Directory ifd0 = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
            if (ifd0 != null) {
                String model = ifd0.getString(ExifIFD0Directory.TAG_MODEL);
                String make = ifd0.getString(ExifIFD0Directory.TAG_MAKE);
                info.setCameraModel((make != null ? make + " " : "") + (model != null ? model : ""));
            }

            ExifSubIFDDirectory subIfd = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory.class);
            if (subIfd != null) {
                Date date = subIfd.getDate(ExifSubIFDDirectory.TAG_DATETIME_ORIGINAL);
                if (date != null) {
                    info.setShootTime(date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime());
                }
            }

            // 3. 读取 GPS
            GpsDirectory gps = metadata.getFirstDirectoryOfType(GpsDirectory.class);
            if (gps != null && gps.getGeoLocation() != null) {
                double lat = gps.getGeoLocation().getLatitude();
                double lon = gps.getGeoLocation().getLongitude();
                String location = String.format("%.2f %s, %.2f %s",
                        Math.abs(lat), lat >= 0 ? "N" : "S",
                        Math.abs(lon), lon >= 0 ? "E" : "W");
                info.setLocationName(location);
            }

        } catch (Exception e) {
            // 提取失败不影响上传
        }
        return info;
    }

    // 【修改】searchImages 方法，增加 onlyFavorites 参数
    public List<ImageInfo> searchImages(Long userId, String keyword, Boolean onlyFavorites) { // 改签名
        // 1. 如果有关键字，先按原逻辑查出 ID 集合 (复制之前的逻辑)
        List<Long> tagImageIds = new ArrayList<>();
        if (keyword != null && !keyword.trim().isEmpty()) {
            // ... (这里保留你原来的标签搜索逻辑：查 ImageTag -> ImageTagRelation -> tagImageIds) ...
            QueryWrapper<ImageTag> tagQuery = new QueryWrapper<>();
            tagQuery.like("tag_name", keyword);
            List<ImageTag> tags = tagMapper.selectList(tagQuery);
            if (!tags.isEmpty()) {
                List<Long> tagIds = tags.stream().map(ImageTag::getId).toList();
                QueryWrapper<ImageTagRelation> relQuery = new QueryWrapper<>();
                relQuery.in("tag_id", tagIds);
                tagImageIds = relationMapper.selectList(relQuery)
                        .stream().map(ImageTagRelation::getImageId).toList();
            }
        }

        // 2. 构建主查询
        QueryWrapper<ImageInfo> imgQuery = new QueryWrapper<>();
        imgQuery.eq("user_id", userId);

        // 【新增】如果只看收藏
        if (Boolean.TRUE.equals(onlyFavorites)) {
            imgQuery.eq("is_favorite", 1);
        }

        // 处理关键字搜索 (如果有)
        if (keyword != null && !keyword.trim().isEmpty()) {
            List<Long> finalIds = tagImageIds;
            imgQuery.and(wrapper -> {
                wrapper.like("file_path", keyword); // 搜文件名
                if (!finalIds.isEmpty()) {
                    wrapper.or().in("id", finalIds); // 搜标签命中
                }
            });
        }

        imgQuery.orderByDesc("upload_time");
        return this.list(imgQuery);
    }

    // 【新增】切换收藏状态 (Toggle)
    public void toggleFavorite(Long id, Long userId) {
        // 1. 先查出来看看现在是啥状态
        ImageInfo img = this.getById(id);
        if (img == null) throw new RuntimeException("图片不存在");
        if (!img.getUserId().equals(userId)) throw new RuntimeException("无权操作");

        // 2. 取反 (如果是1变0，是0/null变1)
        int newStatus = (img.getIsFavorite() != null && img.getIsFavorite() == 1) ? 0 : 1;

        // 3. 更新
        UpdateWrapper<ImageInfo> updateWrapper = new UpdateWrapper<>();
        updateWrapper.eq("id", id).set("is_favorite", newStatus);
        this.update(updateWrapper);
    }

    // ... (deleteImage 和 saveEditedImage 方法保持不变，直接复用您之前的代码) ...
    // 为节省篇幅省略，请保留您文件底部的这两个方法
    @Transactional(rollbackFor = Exception.class)
    public void deleteImage(Long imageId, Long userId) {
        // ... (保持您原有的逻辑) ...
        ImageInfo image = this.getById(imageId);
        if (image == null) throw new RuntimeException("图片不存在");
        if (!image.getUserId().equals(userId)) throw new RuntimeException("无权删除此图片");

        try {
            String fileName = image.getFilePath().replace("/uploads/", "");
            String thumbName = image.getThumbnailPath().replace("/uploads/", "");
            Path filePath = Paths.get(uploadDir).resolve(fileName);
            Path thumbPath = Paths.get(uploadDir).resolve(thumbName);
            Files.deleteIfExists(filePath);
            Files.deleteIfExists(thumbPath);
        } catch (IOException e) {
            System.err.println("物理文件删除失败: " + e.getMessage());
        }

        // 手动删除关联
        metadataMapper.deleteById(imageId);
        relationMapper.delete(new QueryWrapper<ImageTagRelation>().eq("image_id", imageId));
        this.removeById(imageId);
    }

    @Transactional(rollbackFor = Exception.class)
    public ImageInfo saveEditedImage(Long userId, String base64Data) throws IOException {
        // ... (保持您原有的逻辑) ...
        // (略，请复制粘贴原有的 saveEditedImage 代码)
        // 1. 准备路径
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // 2. 解析 Base64 数据
        String[] parts = base64Data.split(",");
        String imageString = parts.length > 1 ? parts[1] : parts[0];
        byte[] imageBytes = Base64.getDecoder().decode(imageString);

        // 3. 生成新文件名
        String uuid = UUID.randomUUID().toString();
        String newFileName = uuid + ".jpg";
        String thumbnailName = uuid + "_thumb.jpg";

        // 4. 保存原图
        Path targetLocation = uploadPath.resolve(newFileName);
        try (OutputStream os = new FileOutputStream(targetLocation.toFile())) {
            os.write(imageBytes);
        }

        // 5. 生成缩略图
        Path thumbLocation = uploadPath.resolve(thumbnailName);
        try {
            Thumbnails.of(targetLocation.toFile())
                    .size(300, 300)
                    .outputQuality(0.8)
                    .toFile(thumbLocation.toFile());
        } catch (Exception e) {
            Files.copy(targetLocation, thumbLocation);
        }

        // 6. 保存到数据库
        ImageInfo imageInfo = new ImageInfo();
        imageInfo.setUserId(userId);
        imageInfo.setFilePath("/uploads/" + newFileName);
        imageInfo.setThumbnailPath("/uploads/" + thumbnailName);
        imageInfo.setUploadTime(LocalDateTime.now());

        this.save(imageInfo);
        return imageInfo;
    }
}
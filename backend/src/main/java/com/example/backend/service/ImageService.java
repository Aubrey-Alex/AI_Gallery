package com.example.backend.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Directory;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.drew.metadata.exif.ExifSubIFDDirectory;
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
import com.example.backend.entity.ImageTag;
import com.example.backend.entity.ImageTagRelation;
import com.example.backend.mapper.ImageTagMapper;
import com.example.backend.mapper.ImageTagRelationMapper;
import java.util.ArrayList;
import java.util.List;

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

    @Value("${file.upload-dir}") // 读取配置文件中的路径
    private String uploadDir;

    @Autowired
    private ImageMetadataMapper metadataMapper;

    @Autowired
    private ImageTagMapper tagMapper;

    @Autowired
    private ImageTagRelationMapper relationMapper;

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
        // 转小写，方便判断
        String extLower = extension.toLowerCase();

        String uuid = UUID.randomUUID().toString();
        String newFileName = uuid + extension;
        String thumbnailName = uuid + "_thumb" + extension;

        // 3. 保存原图
        Path targetLocation = uploadPath.resolve(newFileName);
        file.transferTo(targetLocation.toFile());

        // 4. 【核心完善】生成缩略图 (智能降级策略)
        Path thumbLocation = uploadPath.resolve(thumbnailName);

        try {
            // 4.1 预判：如果是已知不支持压缩的格式，直接抛出异常，进入 catch 块处理
            if (extLower.contains("avif") || extLower.contains("webp") || extLower.contains("gif")) {
                throw new RuntimeException("Format not supported for compression: " + extLower);
            }

            // 4.2 尝试压缩 (针对 JPG, PNG 等)
            Thumbnails.of(targetLocation.toFile())
                    .size(600, 1000)
                    .outputQuality(0.8)
                    .toFile(thumbLocation.toFile());

        } catch (Exception e) {
            // 4.3 【兜底方案】捕获所有异常 (格式不支持、文件损坏、内存不足等)
            // 如果压缩失败，为了保证流程不中断，我们“原样复制”一份作为缩略图
            // 虽然体积没变小，但至少图片能显示，且上传不会报错！
            System.out.println("缩略图生成降级 (直接复制): " + e.getMessage());

            // 如果之前生成了一半失败了，先删掉
            Files.deleteIfExists(thumbLocation);
            // 复制原图
            Files.copy(targetLocation, thumbLocation);
        }

        // 5. 提取 EXIF 信息 (同样加保险，提取失败不影响上传)
        ImageMetadata metaInfo = null;
        try {
            metaInfo = extractMetadata(targetLocation.toFile());
        } catch (Exception e) {
            System.err.println("EXIF 提取失败: " + e.getMessage());
        }

        // 6. 保存 ImageInfo 到数据库
        ImageInfo imageInfo = new ImageInfo();
        imageInfo.setUserId(userId);
        // imageInfo.setFileName(originalFilename); // 数据库无此字段，注释掉
        imageInfo.setFilePath("/uploads/" + newFileName);
        imageInfo.setThumbnailPath("/uploads/" + thumbnailName);
        imageInfo.setUploadTime(LocalDateTime.now());

        this.save(imageInfo);

        // 7. 保存 Metadata 到数据库
        if (metaInfo != null) {
            metaInfo.setImageId(imageInfo.getId());
            metadataMapper.insert(metaInfo);
        }

        return imageInfo;
    }

    // 辅助方法：提取 EXIF
    private ImageMetadata extractMetadata(File file) {
        try {
            Metadata metadata = ImageMetadataReader.readMetadata(file);
            ImageMetadata info = new ImageMetadata();

            // 尝试读取相机型号
            ExifIFD0Directory ifd0 = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
            if (ifd0 != null) {
                info.setCameraModel(ifd0.getString(ExifIFD0Directory.TAG_MODEL));
            }

            // 尝试读取拍摄时间
            ExifSubIFDDirectory subIfd = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory.class);
            if (subIfd != null) {
                Date date = subIfd.getDate(ExifSubIFDDirectory.TAG_DATETIME_ORIGINAL);
                if (date != null) {
                    info.setShootTime(date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime());
                }
                // 读取宽高
                // 注意：实际项目中可能需要更复杂的逻辑来获取真实的宽高
            }
            return info;
        } catch (Exception e) {
            // 提取失败不影响上传，返回 null 或空对象即可
            return new ImageMetadata();
        }
    }

    // 【新增】支持按标签筛选的查询方法
    public List<ImageInfo> listImagesByTag(Long userId, String tagName) {
        // 1. 如果没有传 tag，直接查该用户所有图
        if (tagName == null || tagName.trim().isEmpty()) {
            QueryWrapper<ImageInfo> query = new QueryWrapper<>();
            query.eq("user_id", userId);
            query.orderByDesc("upload_time");
            return this.list(query);
        }

        // 2. 如果传了 tag，先查 tagId
        QueryWrapper<ImageTag> tagQuery = new QueryWrapper<>();
        tagQuery.eq("tag_name", tagName);
        ImageTag tag = tagMapper.selectOne(tagQuery);

        if (tag == null) {
            return new ArrayList<>(); // 没这个标签，自然没图
        }

        // 3. 查关联表，找到拥有该 tagId 的所有 imageId
        QueryWrapper<ImageTagRelation> relQuery = new QueryWrapper<>();
        relQuery.eq("tag_id", tag.getId());
        List<ImageTagRelation> relations = relationMapper.selectList(relQuery);

        if (relations.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> imageIds = relations.stream().map(ImageTagRelation::getImageId).toList();

        // 4. 最后查 image_info 表
        QueryWrapper<ImageInfo> imgQuery = new QueryWrapper<>();
        imgQuery.in("id", imageIds);
        imgQuery.eq("user_id", userId);
        imgQuery.orderByDesc("upload_time");

        return this.list(imgQuery);
    }

    // 【新增】删除图片（同时删除数据库记录和物理文件）
    @Transactional(rollbackFor = Exception.class)
    public void deleteImage(Long imageId, Long userId) {
        // 1. 先查图片是否存在，且是否属于该用户（防止删别人的图）
        ImageInfo image = this.getById(imageId);
        if (image == null) {
            throw new RuntimeException("图片不存在");
        }
        if (!image.getUserId().equals(userId)) {
            throw new RuntimeException("无权删除此图片");
        }

        // 2. 删除物理文件
        try {
            // 还原绝对路径： uploadDir + 文件名
            // image.getFilePath() 存的是 "/uploads/xxx.jpg"，我们需要去掉 "/uploads/"
            String fileName = image.getFilePath().replace("/uploads/", "");
            String thumbName = image.getThumbnailPath().replace("/uploads/", "");

            Path filePath = Paths.get(uploadDir).resolve(fileName);
            Path thumbPath = Paths.get(uploadDir).resolve(thumbName);

            Files.deleteIfExists(filePath); // 删原图
            Files.deleteIfExists(thumbPath); // 删缩略图
        } catch (IOException e) {
            // 物理文件删除失败不应该阻断数据库删除，打印日志即可
            System.err.println("物理文件删除失败: " + e.getMessage());
        }

        // 3. 删除数据库记录
        // MyBatis-Plus 的级联删除机制通常依赖数据库的外键设置 (ON DELETE CASCADE)
        // 如果数据库设置了级联，删 image_info 就会自动删 metadata 和 tag_relation
        this.removeById(imageId);
    }
}
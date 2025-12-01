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

    // 【升级版】全能搜索：同时搜索标签和元数据
    public List<ImageInfo> searchImages(Long userId, String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            QueryWrapper<ImageInfo> query = new QueryWrapper<>();
            query.eq("user_id", userId);
            query.orderByDesc("upload_time");
            return this.list(query);
        }

        // --- 1. 搜索标签 (获取 ImageIDs) ---
        List<Long> tagImageIds = new ArrayList<>();
        QueryWrapper<ImageTag> tagQuery = new QueryWrapper<>();
        tagQuery.like("tag_name", keyword);
        List<ImageTag> tags = tagMapper.selectList(tagQuery);

        if (!tags.isEmpty()) {
            List<Long> tagIds = tags.stream().map(ImageTag::getId).toList();
            QueryWrapper<ImageTagRelation> relQuery = new QueryWrapper<>();
            relQuery.in("tag_id", tagIds);
            List<ImageTagRelation> relations = relationMapper.selectList(relQuery);
            tagImageIds = relations.stream().map(ImageTagRelation::getImageId).toList();
        }

        // --- 2. 搜索元数据 (获取 ImageIDs) 【新增】 ---
        // 搜索逻辑：相机型号包含 keyword 或者 地点包含 keyword
        List<Long> metaImageIds = new ArrayList<>();
        QueryWrapper<ImageMetadata> metaQuery = new QueryWrapper<>();
        metaQuery.like("camera_model", keyword)
                .or()
                .like("location_name", keyword);

        List<ImageMetadata> metadatas = metadataMapper.selectList(metaQuery);
        if (!metadatas.isEmpty()) {
            metaImageIds = metadatas.stream().map(ImageMetadata::getImageId).toList();
        }

        // --- 3. 合并 ID 列表 (去重) ---
        // 将标签搜到的 ID 和元数据搜到的 ID 合并
        List<Long> allIds = Stream.concat(tagImageIds.stream(), metaImageIds.stream())
                .distinct() // 去重
                .collect(Collectors.toList());

        // --- 4. 查主表 ---
        if (allIds.isEmpty()) {
            return new ArrayList<>(); // 啥也没搜到
        }

        QueryWrapper<ImageInfo> imgQuery = new QueryWrapper<>();
        imgQuery.in("id", allIds);
        imgQuery.eq("user_id", userId); // 依然要限制只能看自己的
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

    /**
     * 保存编辑后的图片（作为新图片存储）
     * @param userId 当前用户ID
     * @param base64Data 前端传来的 Base64 字符串 (data:image/jpeg;base64,....)
     */
    @Transactional(rollbackFor = Exception.class)
    public ImageInfo saveEditedImage(Long userId, String base64Data) throws IOException {
        // 1. 准备路径
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // 2. 解析 Base64 数据
        // 前端传来的通常是 "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
        // 我们需要去掉逗号之前的前缀
        String[] parts = base64Data.split(",");
        String imageString = parts.length > 1 ? parts[1] : parts[0];
        byte[] imageBytes = Base64.getDecoder().decode(imageString);

        // 3. 生成新文件名 (统一保存为 jpg)
        String uuid = UUID.randomUUID().toString();
        String newFileName = uuid + ".jpg";
        String thumbnailName = uuid + "_thumb.jpg";

        // 4. 保存原图 (编辑后的大图)
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
            // 兜底：如果压缩失败，直接复制
            Files.copy(targetLocation, thumbLocation);
        }

        // 6. 保存到数据库 (ImageInfo)
        ImageInfo imageInfo = new ImageInfo();
        imageInfo.setUserId(userId);
        imageInfo.setFilePath("/uploads/" + newFileName);
        imageInfo.setThumbnailPath("/uploads/" + thumbnailName);
        imageInfo.setUploadTime(LocalDateTime.now());

        this.save(imageInfo);

        // 7. (可选) 如果您想复制原图的 EXIF 信息，可以在这里做
        // 但通常编辑后的图片 EXIF 会丢失或改变，这里作为新图处理，暂不复制 Metadata

        return imageInfo;
    }
}
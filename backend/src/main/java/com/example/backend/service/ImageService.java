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
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String uuid = UUID.randomUUID().toString();
        String newFileName = uuid + extension;
        String thumbnailName = uuid + "_thumb" + extension;

        // 3. 保存原图
        Path targetLocation = uploadPath.resolve(newFileName);
        file.transferTo(targetLocation.toFile());

        // 4. 生成缩略图 (压缩到宽 300px)
        Path thumbLocation = uploadPath.resolve(thumbnailName);
        Thumbnails.of(targetLocation.toFile())
                .size(300, 300)
                .outputQuality(0.8)
                .toFile(thumbLocation.toFile());

        // 5. 提取 EXIF 信息
        ImageMetadata metaInfo = extractMetadata(targetLocation.toFile());

        // 6. 保存 ImageInfo 到数据库
        ImageInfo imageInfo = new ImageInfo();
        imageInfo.setUserId(userId);

        // 【修正 1】删除 setFileName，因为您的报告数据库设计中没有这个字段
        // imageInfo.setFileName(originalFilename);

        // 【修正 2】路径前缀改为 /uploads/ 方便配置静态资源映射
        imageInfo.setFilePath("/uploads/" + newFileName);

        // 【修正 3】方法名改为 setThumbnailPath，与实体类和报告一致
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
}
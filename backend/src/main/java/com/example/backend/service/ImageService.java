package com.example.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import com.drew.metadata.exif.GpsDirectory;
import com.example.backend.entity.ImageInfo;
import com.example.backend.entity.ImageMetadata;
import com.example.backend.entity.ImageTag;
import com.example.backend.entity.ImageTagRelation;
import com.example.backend.mapper.ImageInfoMapper;
import com.example.backend.mapper.ImageMetadataMapper;
import com.example.backend.mapper.ImageTagMapper;
import com.example.backend.mapper.ImageTagRelationMapper;
import net.coobird.thumbnailator.Thumbnails;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

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
    private TagService tagService;

    @Autowired
    private AIService aiService;

    /**
     * 上传图片主逻辑
     */
    @Transactional(rollbackFor = Exception.class)
    public ImageInfo uploadImage(MultipartFile file, Long userId) throws IOException {
        // 1. 准备上传目录
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // 2. 生成唯一文件名 (UUID)
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.lastIndexOf(".") > 0) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String extLower = extension.toLowerCase();

        String uuid = UUID.randomUUID().toString();
        String newFileName = uuid + extension;
        String thumbnailName = uuid + "_thumb" + extension;

        // 3. 保存原图到磁盘
        Path targetLocation = uploadPath.resolve(newFileName);
        file.transferTo(targetLocation.toFile());

        // 4. 生成缩略图 (使用 Thumbnailator 库，不使用 Canvas)
        Path thumbLocation = uploadPath.resolve(thumbnailName);
        try {
            // 跳过不支持的格式
            if (extLower.contains("avif") || extLower.contains("webp") || extLower.contains("gif")) {
                // 如果是动图或特殊格式，直接复制原图作为缩略图
                Files.copy(targetLocation, thumbLocation);
            } else {
                Thumbnails.of(targetLocation.toFile())
                        .size(600, 1000) // 限制最大宽高
                        .outputQuality(0.8) // 压缩质量
                        .toFile(thumbLocation.toFile());
            }
        } catch (Exception e) {
            // 生成失败时降级：直接复制原图
            Files.deleteIfExists(thumbLocation);
            Files.copy(targetLocation, thumbLocation);
        }

        // 5. 提取 EXIF 信息 (包括 GPS 转城市)
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

            // === 自动打标逻辑 (EXIF) ===
            List<String> autoTags = new ArrayList<>();

            // 提取相机型号作为标签
            if (metaInfo.getCameraModel() != null) {
                String model = metaInfo.getCameraModel().split(" ")[0];
                if (!model.isEmpty()) autoTags.add(model);
            }
            // 提取年份作为标签
            if (metaInfo.getShootTime() != null) {
                autoTags.add(String.valueOf(metaInfo.getShootTime().getYear()));
            }

            // 立即保存 EXIF 标签 (Type = 3)
            if (!autoTags.isEmpty()) {
                tagService.addTags(List.of(imageInfo.getId()), autoTags, 3);
            }
        }

        // 8. AI 智能分析 (Type = 2)
        try {
            // 检查文件格式，部分格式跳过 AI
            if (extension.toLowerCase().contains("avif") || extension.toLowerCase().contains("webp")) {
                System.out.println("跳过 AI 识别：格式不支持 (" + extension + ")");
            } else {
                // 调用百度 AI
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

    /**
     * 辅助方法：提取 EXIF 信息
     * 包含：宽高、相机型号、拍摄时间、GPS定位(转城市)
     */
    private ImageMetadata extractMetadata(File file) {
        ImageMetadata info = new ImageMetadata();
        try {
            // 1. 读取基础宽高
            BufferedImage bimg = ImageIO.read(file);
            if (bimg != null) {
                info.setWidth(bimg.getWidth());
                info.setHeight(bimg.getHeight());
            }

            // 2. 读取 EXIF 标签 (Metadata-extractor)
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

            // 3. 读取 GPS 并转换为 "国家 城市"
            GpsDirectory gps = metadata.getFirstDirectoryOfType(GpsDirectory.class);
            if (gps != null && gps.getGeoLocation() != null) {
                double lat = gps.getGeoLocation().getLatitude();
                double lon = gps.getGeoLocation().getLongitude();

                // 调用全球逆地理编码
                String location = getGlobalLocation(lat, lon);

                info.setLocationName(location);
            }

        } catch (Exception e) {
            // 提取失败不影响上传主流程
        }
        return info;
    }

    /**
     * 高德地图逆地理编码
     * 文档: https://lbs.amap.com/api/webservice/guide/api/georegeo
     */

    private static final String AMAP_KEY = "1eb04750b7f55f92385ded2cf143ea70";

    private String getGlobalLocation(double lat, double lon) {
        try {
            // 1. 构建高德 API URL
            // 注意：高德的坐标顺序是 【经度,纬度】 (lon, lat)，跟国际标准相反，千万别搞反了！
            // output=json: 返回 JSON 格式
            // radius=1000: 搜索半径 1000米
            // extensions=base: 只返回基本地址信息（省市区），不需要周边 POI，速度更快
            String urlStr = String.format(
                    "https://restapi.amap.com/v3/geocode/regeo?key=%s&location=%.6f,%.6f&output=json&radius=1000&extensions=base",
                    AMAP_KEY, lon, lat
            );

            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000); // 5秒超时

            if (conn.getResponseCode() == 200) {
                BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder content = new StringBuilder();
                String inputLine;
                while ((inputLine = in.readLine()) != null) {
                    content.append(inputLine);
                }
                in.close();

                // 2. 解析高德 JSON
                JSONObject json = new JSONObject(content.toString());

                // status "1" 代表成功
                if ("1".equals(json.optString("status"))) {
                    JSONObject regeocode = json.optJSONObject("regeocode");
                    if (regeocode != null) {
                        JSONObject addressComponent = regeocode.optJSONObject("addressComponent");
                        if (addressComponent != null) {
                            // 获取省市区
                            // 注意：高德对直辖市的处理，city 可能会是空数组或空字符串
                            String province = addressComponent.optString("province");

                            // 高德坑点：如果是非直辖市，city 是字符串；如果是直辖市，city 可能是 [] (JSONArray)
                            // 所以这里用 optString 获取，如果不是字符串会变空
                            String city = "";
                            Object cityObj = addressComponent.opt("city");
                            if (cityObj instanceof String) {
                                city = (String) cityObj;
                            }

                            String district = addressComponent.optString("district");

                            // 3. 拼接结果
                            // 逻辑：如果有市且不等于省（普通城市），显示 "省 市"
                            // 如果市为空（直辖市），显示 "市 区"
                            if (city.isEmpty() || city.equals("[]")) {
                                return province + " " + district;
                            } else {
                                return city + " " + district;
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("高德定位解析失败: " + e.getMessage());
        }

        // 降级：如果失败，还是返回经纬度
        return String.format("%.2f, %.2f", lat, lon);
    }

    /**
     * 图片搜索逻辑
     */
    public List<ImageInfo> searchImages(Long userId, String keyword, Boolean onlyFavorites) {
        // 1. 标签搜索：先查出包含关键字的图片 ID
        List<Long> tagImageIds = new ArrayList<>();
        if (keyword != null && !keyword.trim().isEmpty()) {
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

        // 过滤收藏
        if (Boolean.TRUE.equals(onlyFavorites)) {
            imgQuery.eq("is_favorite", 1);
        }

        // 综合查询
        if (keyword != null && !keyword.trim().isEmpty()) {
            List<Long> finalIds = tagImageIds;
            imgQuery.and(wrapper -> {
                wrapper.like("file_path", keyword); // 搜路径(虽然文件名已隐藏，但搜一下也没坏处)
                if (!finalIds.isEmpty()) {
                    wrapper.or().in("id", finalIds); // 搜标签命中
                }
            });
        }

        imgQuery.orderByDesc("upload_time");
        return this.list(imgQuery);
    }

    /**
     * 切换收藏状态
     */
    public void toggleFavorite(Long id, Long userId) {
        ImageInfo img = this.getById(id);
        if (img == null) throw new RuntimeException("图片不存在");
        if (!img.getUserId().equals(userId)) throw new RuntimeException("无权操作");

        int newStatus = (img.getIsFavorite() != null && img.getIsFavorite() == 1) ? 0 : 1;

        UpdateWrapper<ImageInfo> updateWrapper = new UpdateWrapper<>();
        updateWrapper.eq("id", id).set("is_favorite", newStatus);
        this.update(updateWrapper);
    }

    /**
     * 删除图片 (物理删除 + 数据库删除)
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteImage(Long imageId, Long userId) {
        ImageInfo image = this.getById(imageId);
        if (image == null) throw new RuntimeException("图片不存在");
        if (!image.getUserId().equals(userId)) throw new RuntimeException("无权删除此图片");

        try {
            // 物理删除文件
            String fileName = image.getFilePath().replace("/uploads/", "");
            String thumbName = image.getThumbnailPath().replace("/uploads/", "");
            Path filePath = Paths.get(uploadDir).resolve(fileName);
            Path thumbPath = Paths.get(uploadDir).resolve(thumbName);
            Files.deleteIfExists(filePath);
            Files.deleteIfExists(thumbPath);
        } catch (IOException e) {
            System.err.println("物理文件删除失败: " + e.getMessage());
        }

        // 删除关联数据
        metadataMapper.deleteById(imageId);
        relationMapper.delete(new QueryWrapper<ImageTagRelation>().eq("image_id", imageId));
        this.removeById(imageId);
    }

    /**
     * 保存编辑后的图片
     */
    @Transactional(rollbackFor = Exception.class)
    public ImageInfo saveEditedImage(Long userId, String base64Data) throws IOException {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // 解析 Base64
        String[] parts = base64Data.split(",");
        String imageString = parts.length > 1 ? parts[1] : parts[0];
        byte[] imageBytes = Base64.getDecoder().decode(imageString);

        // 生成新文件名
        String uuid = UUID.randomUUID().toString();
        String newFileName = uuid + ".jpg";
        String thumbnailName = uuid + "_thumb.jpg";

        // 保存原图
        Path targetLocation = uploadPath.resolve(newFileName);
        try (OutputStream os = new FileOutputStream(targetLocation.toFile())) {
            os.write(imageBytes);
        }

        // 生成缩略图
        Path thumbLocation = uploadPath.resolve(thumbnailName);
        try {
            Thumbnails.of(targetLocation.toFile())
                    .size(300, 300)
                    .outputQuality(0.8)
                    .toFile(thumbLocation.toFile());
        } catch (Exception e) {
            Files.copy(targetLocation, thumbLocation);
        }

        // 存库
        ImageInfo imageInfo = new ImageInfo();
        imageInfo.setUserId(userId);
        imageInfo.setFilePath("/uploads/" + newFileName);
        imageInfo.setThumbnailPath("/uploads/" + thumbnailName);
        imageInfo.setUploadTime(LocalDateTime.now());

        this.save(imageInfo);
        return imageInfo;
    }
}
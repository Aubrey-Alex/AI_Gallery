package com.example.backend.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("image_metadata")
public class ImageMetadata {
    // 主键 (手动设置，等于 image_info 的 id)
    @TableId
    private Long imageId;

    private Integer width;
    private Integer height;
    private String cameraModel;
    private String locationName;
    private LocalDateTime shootTime;

    // === 新增字段 ===

    /**
     * 是否已完成向量化: 0-否, 1-是
     */
    @TableField("is_vectorized")
    private Integer isVectorized;

    /**
     * 核心向量数据
     * 数据库存的是 JSON，我们用 String 来接，避免 MyBatis 复杂的 TypeHandler 配置
     */
    @TableField("embedding")
    private String embedding;

    // --- Getters and Setters (包含原有和新增的) ---

    public Long getImageId() { return imageId; }
    public void setImageId(Long imageId) { this.imageId = imageId; }

    public Integer getWidth() { return width; }
    public void setWidth(Integer width) { this.width = width; }

    public Integer getHeight() { return height; }
    public void setHeight(Integer height) { this.height = height; }

    public String getCameraModel() { return cameraModel; }
    public void setCameraModel(String cameraModel) { this.cameraModel = cameraModel; }

    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }

    public LocalDateTime getShootTime() { return shootTime; }
    public void setShootTime(LocalDateTime shootTime) { this.shootTime = shootTime; }

    // 新增字段的 Getter/Setter
    public Integer getIsVectorized() { return isVectorized; }
    public void setIsVectorized(Integer isVectorized) { this.isVectorized = isVectorized; }

    public String getEmbedding() { return embedding; }
    public void setEmbedding(String embedding) { this.embedding = embedding; }
}
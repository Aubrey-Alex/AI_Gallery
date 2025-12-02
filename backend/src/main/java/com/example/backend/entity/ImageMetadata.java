package com.example.backend.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("image_metadata")
public class ImageMetadata {
    // 注意：这里的主键不是自增的，而是手动设置（等于 image_info 的 id）
    @TableId
    private Long imageId;

    private Integer width;
    private Integer height;
    private String cameraModel;
    private String locationName;
    private LocalDateTime shootTime;

    // --- Getters and Setters ---

    public Long getImageId() {
        return imageId;
    }

    public void setImageId(Long imageId) {
        this.imageId = imageId;
    }

    public Integer getWidth() {
        return width;
    }

    public void setWidth(Integer width) {
        this.width = width;
    }

    public Integer getHeight() {
        return height;
    }

    public void setHeight(Integer height) {
        this.height = height;
    }

    public String getCameraModel() {
        return cameraModel;
    }

    public void setCameraModel(String cameraModel) {
        this.cameraModel = cameraModel;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public LocalDateTime getShootTime() {
        return shootTime;
    }

    public void setShootTime(LocalDateTime shootTime) {
        this.shootTime = shootTime;
    }
}
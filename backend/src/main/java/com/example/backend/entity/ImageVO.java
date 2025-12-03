package com.example.backend.entity;

import java.util.List;

public class ImageVO extends ImageInfo {
    // 【核心修改】从 List<String> 改为 List<ImageTag>，以便携带 tagType
    private List<ImageTag> tags;
    private ImageMetadata metadata;
    private Integer isFavorite;

    // Getters & Setters
    public List<ImageTag> getTags() { return tags; }
    public void setTags(List<ImageTag> tags) { this.tags = tags; }

    // ... 其他 getter/setter 不变
    public ImageMetadata getMetadata() { return metadata; }
    public void setMetadata(ImageMetadata metadata) { this.metadata = metadata; }
}
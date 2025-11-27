package com.example.backend.entity;

import java.util.List;

// 继承 ImageInfo，拥有它的所有属性
public class ImageVO extends ImageInfo {
    // 额外增加一个标签列表属性
    private List<String> tags;
    // 【新增】元数据对象
    private ImageMetadata metadata;

    // Getter & Setter
    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public ImageMetadata getMetadata() { return metadata; }
    public void setMetadata(ImageMetadata metadata) { this.metadata = metadata; }
}
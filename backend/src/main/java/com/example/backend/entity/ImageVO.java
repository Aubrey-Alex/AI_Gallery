package com.example.backend.entity;

import java.util.List;

// 继承 ImageInfo，拥有它的所有属性
public class ImageVO extends ImageInfo {
    // 额外增加一个标签列表属性
    private List<String> tags;

    // Getter & Setter
    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }
}
package com.example.backend.entity;

public class TagVO {
    private String tagName;
    private Integer count;

    // 构造函数
    public TagVO(String tagName, Integer count) {
        this.tagName = tagName;
        this.count = count;
    }

    // Getters & Setters
    public String getTagName() { return tagName; }
    public void setTagName(String tagName) { this.tagName = tagName; }
    public Integer getCount() { return count; }
    public void setCount(Integer count) { this.count = count; }
}
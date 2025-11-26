package com.example.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

@TableName("image_tag_relation")
public class ImageTagRelation {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long imageId;
    private Long tagId;

    // --- Getters and Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getImageId() { return imageId; }
    public void setImageId(Long imageId) { this.imageId = imageId; }
    public Long getTagId() { return tagId; }
    public void setTagId(Long tagId) { this.tagId = tagId; }
}
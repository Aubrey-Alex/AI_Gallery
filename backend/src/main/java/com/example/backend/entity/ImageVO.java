package com.example.backend.entity;

import java.util.List;

public class ImageVO extends ImageInfo {

    private List<ImageTag> tags;
    private ImageMetadata metadata;
    private Integer isFavorite;

    // Getters & Setters
    public List<ImageTag> getTags() { return tags; }
    public void setTags(List<ImageTag> tags) { this.tags = tags; }

    public ImageMetadata getMetadata() { return metadata; }
    public void setMetadata(ImageMetadata metadata) { this.metadata = metadata; }
}
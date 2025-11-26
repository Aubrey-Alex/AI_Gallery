package com.example.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.backend.entity.ImageTag;
import com.example.backend.entity.ImageTagRelation;
import com.example.backend.mapper.ImageTagMapper;
import com.example.backend.mapper.ImageTagRelationMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.backend.entity.ImageInfo;
import com.example.backend.entity.TagVO;
import com.example.backend.mapper.ImageInfoMapper;
import java.util.Map;
import java.util.ArrayList;
import java.util.HashMap;

import java.util.List;

@Service
public class TagService {

    @Autowired
    private ImageTagMapper tagMapper;

    @Autowired
    private ImageTagRelationMapper relationMapper;

    @Autowired
    private ImageInfoMapper imageInfoMapper;

    /**
     * 核心功能：给多张图片添加多个自定义标签
     * @param imageIds 图片ID列表
     * @param tagNames 标签名称列表 (例如 ["旅游", "杭州"])
     */
    @Transactional(rollbackFor = Exception.class)
    public void addTags(List<Long> imageIds, List<String> tagNames) {
        if (imageIds == null || imageIds.isEmpty() || tagNames == null || tagNames.isEmpty()) {
            return;
        }

        for (String rawName : tagNames) {
            // 【修复】去空格，确保 " 杭州 " 变成 "杭州"
            if (rawName == null || rawName.trim().isEmpty()) continue;
            String name = rawName.trim();
            // 1. 检查标签是否已存在于字典表
            // 注意：这里我们处理的是“自定义标签”，所以默认 type=1
            QueryWrapper<ImageTag> query = new QueryWrapper<>();
            query.eq("tag_name", name);
            ImageTag existingTag = tagMapper.selectOne(query);

            Long tagId;
            if (existingTag == null) {
                // 2. 如果不存在，创建新标签
                ImageTag newTag = new ImageTag();
                newTag.setTagName(name);
                newTag.setTagType(1); // 1 代表人工标签
                tagMapper.insert(newTag);
                tagId = newTag.getId(); // 获取新生成的 ID
            } else {
                // 3. 如果存在，直接复用 ID
                tagId = existingTag.getId();
            }

            // 4. 遍历每一张图片，建立关联
            for (Long imgId : imageIds) {
                // 先检查是否已经打过这个标签了，防止重复
                QueryWrapper<ImageTagRelation> relQuery = new QueryWrapper<>();
                relQuery.eq("image_id", imgId).eq("tag_id", tagId);

                if (relationMapper.selectCount(relQuery) == 0) {
                    ImageTagRelation relation = new ImageTagRelation();
                    relation.setImageId(imgId);
                    relation.setTagId(tagId);
                    relationMapper.insert(relation);
                }
            }
        }
    }

    // 【新增】根据图片ID查询所有标签名
    public List<String> getTagsByImageId(Long imageId) {
        // 这通常需要联表查询，为了简单，我们用 MyBatis-Plus 的逻辑拼装
        // 1. 先查关系表拿到 tagIds
        QueryWrapper<ImageTagRelation> relQuery = new QueryWrapper<>();
        relQuery.eq("image_id", imageId);
        List<ImageTagRelation> relations = relationMapper.selectList(relQuery);

        if (relations.isEmpty()) {
            return List.of(); // 返回空列表
        }

        List<Long> tagIds = relations.stream().map(ImageTagRelation::getTagId).toList();

        // 2. 再查标签表拿到 Names
        List<ImageTag> tags = tagMapper.selectBatchIds(tagIds);
        return tags.stream().map(ImageTag::getTagName).toList();
    }

    // 【新增】统计当前用户的标签使用情况
    public List<TagVO> getUserTagStats(Long userId) {
        // 1. 查出该用户所有的图片 ID
        QueryWrapper<ImageInfo> imgQuery = new QueryWrapper<>();
        imgQuery.eq("user_id", userId);
        imgQuery.select("id"); // 只查 ID 优化性能
        List<ImageInfo> userImages = imageInfoMapper.selectList(imgQuery);

        if (userImages.isEmpty()) return new ArrayList<>();

        List<Long> imageIds = userImages.stream().map(ImageInfo::getId).toList();

        // 2. 查出这些图片关联的所有标签 ID
        QueryWrapper<ImageTagRelation> relQuery = new QueryWrapper<>();
        relQuery.in("image_id", imageIds);
        List<ImageTagRelation> relations = relationMapper.selectList(relQuery);

        if (relations.isEmpty()) return new ArrayList<>();

        // 3. 统计每个 TagID 出现的次数 (Key: TagId, Value: Count)
        Map<Long, Integer> countMap = new HashMap<>();
        for (ImageTagRelation rel : relations) {
            countMap.put(rel.getTagId(), countMap.getOrDefault(rel.getTagId(), 0) + 1);
        }

        // 4. 查出 Tag 的具体名字，并封装成 VO
        List<ImageTag> tags = tagMapper.selectBatchIds(countMap.keySet());

        List<TagVO> result = new ArrayList<>();
        for (ImageTag tag : tags) {
            Integer count = countMap.get(tag.getId());
            // 这里我们可以过滤一下，只显示用户自定义标签 (Type=1) 放在"我的标签"里
            // 如果你想显示所有，就去掉这个 if
            if (tag.getTagType() == 1) {
                result.add(new TagVO(tag.getTagName(), count));
            }
        }

        return result;
    }
}
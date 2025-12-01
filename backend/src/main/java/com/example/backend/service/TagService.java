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
     * 重载方法：给 Controller 使用，默认类型为 1 (人工)
     */
    @Transactional(rollbackFor = Exception.class)
    public void addTags(List<Long> imageIds, List<String> tagNames) {
        addTags(imageIds, tagNames, 1);
    }

    /**
     * 核心功能：给多张图片添加多个自定义标签 (支持指定类型)
     * @param imageIds 图片ID列表
     * @param tagNames 标签名称列表
     * @param type 标签类型 (1:人工, 2:AI, 3:EXIF)
     */
    @Transactional(rollbackFor = Exception.class)
    public void addTags(List<Long> imageIds, List<String> tagNames, int type) {
        if (imageIds == null || imageIds.isEmpty() || tagNames == null || tagNames.isEmpty()) {
            return;
        }

        for (String rawName : tagNames) {
            // 去空格
            if (rawName == null || rawName.trim().isEmpty()) continue;
            String name = rawName.trim();

            // 1. 检查标签是否已存在
            QueryWrapper<ImageTag> query = new QueryWrapper<>();
            query.eq("tag_name", name);
            ImageTag existingTag = tagMapper.selectOne(query);

            Long tagId;
            if (existingTag == null) {
                // 2. 如果不存在，创建新标签
                ImageTag newTag = new ImageTag();
                newTag.setTagName(name);
                newTag.setTagType(type); // 【核心修改】使用传入的 type
                tagMapper.insert(newTag);
                tagId = newTag.getId();
            } else {
                // 3. 如果存在，复用 ID
                tagId = existingTag.getId();
            }

            // 4. 建立关联
            for (Long imgId : imageIds) {
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

    // 获取单张图片的所有标签 (返回完整对象，包含 type)
    public List<ImageTag> getTagsByImageId(Long imageId) {
        QueryWrapper<ImageTagRelation> relQuery = new QueryWrapper<>();
        relQuery.eq("image_id", imageId);
        List<ImageTagRelation> relations = relationMapper.selectList(relQuery);

        if (relations.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> tagIds = relations.stream().map(ImageTagRelation::getTagId).toList();
        return tagMapper.selectBatchIds(tagIds);
    }

    // 统计用户标签
    public List<TagVO> getUserTagStats(Long userId) {
        // 1. 查图片
        QueryWrapper<ImageInfo> imgQuery = new QueryWrapper<>();
        imgQuery.eq("user_id", userId);
        imgQuery.select("id");
        List<ImageInfo> userImages = imageInfoMapper.selectList(imgQuery);

        if (userImages.isEmpty()) return new ArrayList<>();

        List<Long> imageIds = userImages.stream().map(ImageInfo::getId).toList();

        // 2. 查关联
        QueryWrapper<ImageTagRelation> relQuery = new QueryWrapper<>();
        relQuery.in("image_id", imageIds);
        List<ImageTagRelation> relations = relationMapper.selectList(relQuery);

        if (relations.isEmpty()) return new ArrayList<>();

        // 3. 统计次数
        Map<Long, Integer> countMap = new HashMap<>();
        for (ImageTagRelation rel : relations) {
            countMap.put(rel.getTagId(), countMap.getOrDefault(rel.getTagId(), 0) + 1);
        }

        // 4. 封装 VO
        List<ImageTag> tags = tagMapper.selectBatchIds(countMap.keySet());
        List<TagVO> result = new ArrayList<>();

        for (ImageTag tag : tags) {
            Integer count = countMap.get(tag.getId());
            // 【修改】这里不再过滤 type==1，而是把所有标签都返回
            // 可以在 TagVO 里加一个 type 字段传给前端，让前端决定侧边栏显示什么
            // 假设 TagVO 还没有 type 字段，我们暂时先只返回人工标签以保持侧边栏干净
            // 如果你想在侧边栏也显示 EXIF 标签，就把下面这个 if 去掉
            if (tag.getTagType() == 1) {
                result.add(new TagVO(tag.getTagName(), count));
            }
        }

        return result;
    }
}
package com.example.backend.service;

import com.alibaba.dashscope.embeddings.MultiModalEmbedding;
import com.alibaba.dashscope.embeddings.MultiModalEmbeddingItemBase; // 1. 【核心修改】引入正确的 Base 类
import com.alibaba.dashscope.embeddings.MultiModalEmbeddingItemImage;
import com.alibaba.dashscope.embeddings.MultiModalEmbeddingItemText;
import com.alibaba.dashscope.embeddings.MultiModalEmbeddingParam;
import com.alibaba.dashscope.embeddings.MultiModalEmbeddingResult;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.example.backend.entity.ImageInfo;
import com.example.backend.entity.ImageMetadata;
import com.example.backend.entity.ImageTag;
import com.example.backend.entity.ImageTagRelation;
import com.example.backend.mapper.ImageInfoMapper;
import com.example.backend.mapper.ImageMetadataMapper;
import com.example.backend.mapper.ImageTagMapper;
import com.example.backend.mapper.ImageTagRelationMapper;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MCPService {

    // ⚠️ 建议将 Key 移至 application.yml 配置中
    private static final String API_KEY = "sk-6bbf5eaf65c84bfe85556832f339c71c";

    @Autowired
    private ImageInfoMapper imageInfoMapper;
    @Autowired
    private ImageMetadataMapper metadataMapper;
    @Autowired
    private ImageTagMapper tagMapper;
    @Autowired
    private ImageTagRelationMapper relationMapper;

    @Value("${file.upload-dir}")
    private String uploadDir;

    private final Gson gson = new Gson();

    /**
     * 1. 图片向量化 (增强版：多模态融合)
     */
    public void vectoriseImage(Long imageId) {
        try {
            // 1. 获取图片基础信息
            ImageInfo image = imageInfoMapper.selectById(imageId);
            if (image == null) return;

            // 2. 准备图片文件的本地 URI
            String dbPath = image.getThumbnailPath();
            if (dbPath == null || dbPath.isEmpty()) {
                dbPath = image.getFilePath();
            }
            String fileName = dbPath.substring(dbPath.lastIndexOf("/") + 1);
            Path physicalPath = Paths.get(uploadDir).resolve(fileName).toAbsolutePath();

            if (!Files.exists(physicalPath)) {
                System.err.println("❌ 本地文件不存在: " + physicalPath);
                return;
            }
            // 转换为 file:/// 协议的 URL
            String fileUrl = physicalPath.toUri().toString();

            // 3. 构建语义上下文描述 (Semantic Context)
            StringBuilder contextBuilder = new StringBuilder();

            // 3.1 提取元数据 (地点、时间、设备)
            ImageMetadata meta = metadataMapper.selectOne(new QueryWrapper<ImageMetadata>().eq("image_id", imageId));
            if (meta != null) {
                if (meta.getLocationName() != null && !meta.getLocationName().isEmpty()) {
                    contextBuilder.append("拍摄地点位于").append(meta.getLocationName()).append("。");
                }
                if (meta.getShootTime() != null) {
                    contextBuilder.append("拍摄时间是").append(meta.getShootTime().getYear()).append("年。");
                }
                if (meta.getCameraModel() != null && !meta.getCameraModel().isEmpty()) {
                    contextBuilder.append("由").append(meta.getCameraModel()).append("拍摄。");
                }
            }

            // 3.2 提取已有的标签 (Tags)
            List<ImageTagRelation> relations = relationMapper.selectList(new QueryWrapper<ImageTagRelation>().eq("image_id", imageId));
            if (relations != null && !relations.isEmpty()) {
                List<Long> tagIds = relations.stream().map(ImageTagRelation::getTagId).collect(Collectors.toList());
                List<ImageTag> tags = tagMapper.selectBatchIds(tagIds);

                if (tags != null && !tags.isEmpty()) {
                    String tagStr = tags.stream().map(ImageTag::getTagName).collect(Collectors.joining("，"));
                    contextBuilder.append("包含的元素有：").append(tagStr).append("。");
                }
            }

            String semanticText = contextBuilder.toString();
            System.out.println("🧠 正在向量化 [" + imageId + "]: 图片 + 语义描述[" + semanticText + "]");

            // 4. 构造多模态请求
            // 2. 【核心修改】泛型必须是 MultiModalEmbeddingItemBase，否则会报错
            List<MultiModalEmbeddingItemBase> contents = new ArrayList<>();

            // 添加图片项
            contents.add(new MultiModalEmbeddingItemImage(fileUrl));

            // 添加文本项
            if (!semanticText.isEmpty()) {
                contents.add(new MultiModalEmbeddingItemText(semanticText));
            }

            MultiModalEmbedding embedding = new MultiModalEmbedding();
            MultiModalEmbeddingParam param = MultiModalEmbeddingParam.builder()
                    .apiKey(API_KEY)
                    .model("multimodal-embedding-v1")
                    .contents(contents) // 现在类型匹配了
                    .build();

            // 5. 调用 API
            MultiModalEmbeddingResult result = embedding.call(param);

            // 6. 保存向量结果
            if (result.getOutput() != null &&
                    result.getOutput().getEmbeddings() != null &&
                    !result.getOutput().getEmbeddings().isEmpty()) {

                List<Double> vector = result.getOutput().getEmbeddings().get(0).getEmbedding();
                System.out.println("✅ 向量化成功! 维度: " + vector.size());

                QueryWrapper<ImageMetadata> checkWrapper = new QueryWrapper<>();
                checkWrapper.eq("image_id", imageId);
                Long count = metadataMapper.selectCount(checkWrapper);

                String vectorJson = gson.toJson(vector);

                if (count == 0) {
                    ImageMetadata newMeta = new ImageMetadata();
                    newMeta.setImageId(imageId);
                    newMeta.setEmbedding(vectorJson);
                    newMeta.setIsVectorized(1);
                    newMeta.setWidth(0);
                    newMeta.setHeight(0);
                    metadataMapper.insert(newMeta);
                } else {
                    UpdateWrapper<ImageMetadata> update = new UpdateWrapper<>();
                    update.eq("image_id", imageId);
                    update.set("embedding", vectorJson);
                    update.set("is_vectorized", 1);
                    metadataMapper.update(null, update);
                }
            } else {
                System.err.println("❌ 向量化失败，API返回为空: " + result);
            }

        } catch (Exception e) {
            System.err.println("❌ 向量化过程发生异常: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * SearchResult DTO
     */
    public static class SearchResult {
        public Long id;
        public Double score;
        public String thumbnailPath;
        public String filePath;
        public SearchResult(Long id, Double score, String thumbnailPath, String filePath) {
            this.id = id;
            this.score = score;
            this.thumbnailPath = thumbnailPath;
            this.filePath = filePath;
        }
    }

    /**
     * 2. 文本搜图
     */
    public List<SearchResult> searchImageByText(String textQuery) {
        try {
            System.out.println("🔍 AI Search 请求: " + textQuery);

            // 3. 【核心修改】搜图时也要用 Base 类型的 List
            List<MultiModalEmbeddingItemBase> contents = new ArrayList<>();
            contents.add(new MultiModalEmbeddingItemText(textQuery));

            MultiModalEmbedding embedding = new MultiModalEmbedding();
            MultiModalEmbeddingParam param = MultiModalEmbeddingParam.builder()
                    .apiKey(API_KEY)
                    .model("multimodal-embedding-v1")
                    .contents(contents) // 修复可能的泛型报错
                    .build();

            MultiModalEmbeddingResult result = embedding.call(param);

            if (result.getOutput() == null ||
                    result.getOutput().getEmbeddings() == null ||
                    result.getOutput().getEmbeddings().isEmpty()) {
                return new ArrayList<>();
            }

            List<Double> queryVector = result.getOutput().getEmbeddings().get(0).getEmbedding();

            // 获取所有已向量化的图片数据
            QueryWrapper<ImageMetadata> wrapper = new QueryWrapper<>();
            wrapper.select("image_id", "embedding").eq("is_vectorized", 1);
            List<ImageMetadata> allMetadata = metadataMapper.selectList(wrapper);

            System.out.println("📚 对比库大小: " + allMetadata.size());

            List<SearchResult> results = new ArrayList<>();

            for (ImageMetadata meta : allMetadata) {
                if (meta.getEmbedding() != null && !meta.getEmbedding().isEmpty()) {
                    List<Double> imgVector = gson.fromJson(meta.getEmbedding(),
                            new TypeToken<List<Double>>(){}.getType());

                    double similarity = cosineSimilarity(queryVector, imgVector);

                    // 阈值：根据多模态融合后的效果，通常可以设在 0.2 ~ 0.25 左右
                    if (similarity > 0) {
                        ImageInfo info = imageInfoMapper.selectById(meta.getImageId());
                        if (info != null) {
                            results.add(new SearchResult(meta.getImageId(), similarity,
                                    info.getThumbnailPath(),
                                    info.getFilePath()));
                        }
                    }
                }
            }

            results.sort((a, b) -> b.score.compareTo(a.score));
            return results;

        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    private double cosineSimilarity(List<Double> v1, List<Double> v2) {
        if (v1 == null || v2 == null || v1.size() != v2.size()) return 0.0;
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        for (int i = 0; i < v1.size(); i++) {
            dotProduct += v1.get(i) * v2.get(i);
            normA += Math.pow(v1.get(i), 2);
            normB += Math.pow(v2.get(i), 2);
        }
        if (normA == 0 || normB == 0) return 0.0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
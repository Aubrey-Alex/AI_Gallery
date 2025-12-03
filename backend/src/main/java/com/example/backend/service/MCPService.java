package com.example.backend.service;

import com.alibaba.dashscope.embeddings.MultiModalEmbedding;
import com.alibaba.dashscope.embeddings.MultiModalEmbeddingItemImage;
import com.alibaba.dashscope.embeddings.MultiModalEmbeddingItemText;
import com.alibaba.dashscope.embeddings.MultiModalEmbeddingParam;
import com.alibaba.dashscope.embeddings.MultiModalEmbeddingResult;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.example.backend.entity.ImageInfo;
import com.example.backend.entity.ImageMetadata;
import com.example.backend.mapper.ImageInfoMapper;
import com.example.backend.mapper.ImageMetadataMapper;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@Service
public class MCPService {

    // ⚠️ 注意：Key 最好放在 application.yml 中
    private static final String API_KEY = "sk-6bbf5eaf65c84bfe85556832f339c71c";

    @Autowired
    private ImageInfoMapper imageInfoMapper;
    @Autowired
    private ImageMetadataMapper metadataMapper;

    @Value("${file.upload-dir}")
    private String uploadDir;

    private final Gson gson = new Gson();

    /**
     * 读取本地文件转 Base64
     */
    private String imageToBase64(Path path) {
        try {
            if (!Files.exists(path)) {
                System.err.println("❌ 文件不存在: " + path.toAbsolutePath());
                return null;
            }
            // 检查文件大小，如果缩略图依然过大（虽然不太可能），可以在这里做二次压缩逻辑
            // 一般 Thumbnails 压缩后的图片只有几十KB，完全符合 API 要求
            byte[] fileContent = Files.readAllBytes(path);
            String base64Content = Base64.getEncoder().encodeToString(fileContent);
            return "data:image/jpeg;base64," + base64Content;
        } catch (IOException e) {
            System.err.println("❌ 读取图片失败: " + path);
            e.printStackTrace();
            return null;
        }
    }

    /**
     * 1. 图片向量化 (最终修复版：使用 file:// 协议)
     */
    public void vectoriseImage(Long imageId) {
        try {
            ImageInfo image = imageInfoMapper.selectById(imageId);
            if (image == null) return;

            // 1. 获取本地绝对路径 (优先缩略图)
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

            System.out.println("🔍 正在向量化图片: " + physicalPath);

            // 【修复这里】利用 Java 原生方法生成标准 URI
            String fileUrl = physicalPath.toUri().toString();

            // 打印一下看看，应该是 file:///D:/... 这种格式
            System.out.println("DEBUG URI: " + fileUrl);

            // 2. 构造参数
            MultiModalEmbeddingItemImage itemImage = new MultiModalEmbeddingItemImage(fileUrl);

            MultiModalEmbedding embedding = new MultiModalEmbedding();
            MultiModalEmbeddingParam param = MultiModalEmbeddingParam.builder()
                    .apiKey(API_KEY)
                    .model("multimodal-embedding-v1")
                    .contents(Collections.singletonList(itemImage))
                    .build();

            // 3. 调用 API
            MultiModalEmbeddingResult result = embedding.call(param);

            // 4. 【最终修复】解析结果
            // 阿里云现在的 SDK 返回结构是将结果放在 embeddings 列表中
            if (result.getOutput() != null &&
                    result.getOutput().getEmbeddings() != null &&
                    !result.getOutput().getEmbeddings().isEmpty()) {

                // 获取第一个结果的向量
                List<Double> vector = result.getOutput().getEmbeddings().get(0).getEmbedding();

                System.out.println("✅ 向量化成功! 维度: " + vector.size());

                // === 存入数据库 ===
                QueryWrapper<ImageMetadata> checkWrapper = new QueryWrapper<>();
                checkWrapper.eq("image_id", imageId);
                Long count = metadataMapper.selectCount(checkWrapper);

                if (count == 0) {
                    ImageMetadata newMeta = new ImageMetadata();
                    newMeta.setImageId(imageId);
                    newMeta.setEmbedding(gson.toJson(vector));
                    newMeta.setIsVectorized(1);
                    newMeta.setWidth(0); newMeta.setHeight(0);
                    metadataMapper.insert(newMeta);
                } else {
                    UpdateWrapper<ImageMetadata> update = new UpdateWrapper<>();
                    update.eq("image_id", imageId);
                    update.set("embedding", gson.toJson(vector));
                    update.set("is_vectorized", 1);
                    metadataMapper.update(null, update);
                }

            } else {
                System.err.println("❌ 向量化失败: " + result);
            }

        } catch (Exception e) {
            System.err.println("❌ 发生异常: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * SearchResult DTO
     */
    public static class SearchResult {
        public Long id;
        public Double score;
        public SearchResult(Long id, Double score) {
            this.id = id;
            this.score = score;
        }
    }

    /**
     * 2. 文本搜图 (保持不变)
     */
    public List<SearchResult> searchImageByText(String textQuery) {
        try {
            System.out.println("🔍 收到搜索请求: " + textQuery); // 1. 加个日志确认进来了

            MultiModalEmbeddingItemText itemText = new MultiModalEmbeddingItemText(textQuery);

            MultiModalEmbedding embedding = new MultiModalEmbedding();
            MultiModalEmbeddingParam param = MultiModalEmbeddingParam.builder()
                    .apiKey(API_KEY)
                    .model("multimodal-embedding-v1")
                    .contents(Collections.singletonList(itemText))
                    .build();

            MultiModalEmbeddingResult result = embedding.call(param);

            // 2. 打印 API 原始返回，看看结构
            // System.out.println("DEBUG API Result: " + result);

            // 3. 【核心修复】这里要改！使用 getEmbeddings().get(0)
            if (result.getOutput() == null ||
                    result.getOutput().getEmbeddings() == null ||
                    result.getOutput().getEmbeddings().isEmpty()) {
                System.err.println("❌ API 返回结果为空");
                return new ArrayList<>();
            }

            // 获取文本向量 (注意这里是 getEmbeddings().get(0).getEmbedding())
            List<Double> queryVector = result.getOutput().getEmbeddings().get(0).getEmbedding();

            System.out.println("✅ 文本向量化成功，维度: " + queryVector.size());

            // 获取所有已向量化的数据
            QueryWrapper<ImageMetadata> wrapper = new QueryWrapper<>();
            wrapper.select("image_id", "embedding").eq("is_vectorized", 1);
            List<ImageMetadata> allMetadata = metadataMapper.selectList(wrapper);

            System.out.println("📚 数据库中找到已向量化图片数量: " + allMetadata.size()); // 4. 确认查到了数据

            List<SearchResult> results = new ArrayList<>();

            for (ImageMetadata meta : allMetadata) {
                if (meta.getEmbedding() != null) {
                    List<Double> imgVector = gson.fromJson(meta.getEmbedding(),
                            new TypeToken<List<Double>>(){}.getType());

                    double similarity = cosineSimilarity(queryVector, imgVector);

                    // 5. 打印每张图的相似度，方便调试阈值
                     System.out.println("ID: " + meta.getImageId() + " | Similarity: " + similarity);

                    // 阈值根据实际效果微调
                    if (similarity > 0.15) {
                        results.add(new SearchResult(meta.getImageId(), similarity));
                    }
                }
            }

            // 按分数降序排列
            results.sort((a, b) -> b.score.compareTo(a.score));

            System.out.println("🎯 最终匹配结果数量: " + results.size());
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
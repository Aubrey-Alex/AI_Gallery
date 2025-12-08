package com.example.backend.service;

import com.baidu.aip.imageclassify.AipImageClassify;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

@Service
public class AIService {

    // 1. 注入变量
    @Value("${baidu.ai.app-id}")
    private String appId;

    @Value("${baidu.ai.api-key}")
    private String apiKey;

    @Value("${baidu.ai.secret-key}")
    private String secretKey;

    private AipImageClassify client;

    // 阈值定义
    private static final double STRICT_THRESHOLD = 0.4;

    /**
     * ！！不可以在 public AIService() { ... } 构造函数里初始化 client
     * 必须用 @PostConstruct，确保变量注入后再执行。
     */
    @PostConstruct
    public void init() {
        // 打印日志验证是否读取到 (只显示前4位，防止泄露)
        System.out.println("========== 百度AI 初始化检查 ==========");
        System.out.println("AppID: " + appId);
        System.out.println("API Key: " + (apiKey != null ? apiKey.substring(0, 4) + "***" : "NULL"));

        if (apiKey == null || secretKey == null) {
            System.err.println("❌ 严重错误：Key 为 NULL，请检查 application.yml");
            return;
        }

        // 初始化客户端
        client = new AipImageClassify(appId, apiKey, secretKey);
        client.setConnectionTimeoutInMillis(2000);
        client.setSocketTimeoutInMillis(60000);
        System.out.println("✅ 百度AI 客户端初始化成功！");
        System.out.println("=======================================");
    }

    public List<String> detectImageTags(String localFilePath) {
        List<String> finalTags = new ArrayList<>();

        // 防御性编程：万一初始化失败，防止空指针
        if (client == null) {
            System.err.println("❌ 错误：百度AI客户端未正确初始化");
            return finalTags;
        }

        try {
            JSONObject res = client.advancedGeneral(localFilePath, new HashMap<>());

            // 检查是否有错误码
            if (res.has("error_code")) {
                System.err.println("❌ 百度API报错: " + res.toString());
                return finalTags;
            }

            // 解析结果
            if (res.has("result")) {
                JSONArray resultArray = res.getJSONArray("result");
                List<JSONObject> candidates = new ArrayList<>();
                int limit = Math.min(resultArray.length(), 5);

                for (int i = 0; i < limit; i++) {
                    candidates.add(resultArray.getJSONObject(i));
                }

                // 策略A：优先找高置信度
                for (JSONObject item : candidates) {
                    if (item.getDouble("score") > STRICT_THRESHOLD) {
                        finalTags.add(item.getString("keyword"));
                    }
                }

                // 策略B：保底
                if (finalTags.isEmpty() && !candidates.isEmpty()) {
                    System.out.println("触发保底策略...");
                    for (int i = 0; i < Math.min(candidates.size(), 2); i++) {
                        JSONObject item = candidates.get(i);
                        if (item.getDouble("score") > 0.09) {
                            finalTags.add(item.getString("keyword"));
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return finalTags;
    }
}
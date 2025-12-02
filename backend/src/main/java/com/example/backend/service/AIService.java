package com.example.backend.service;

import com.baidu.aip.imageclassify.AipImageClassify;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

@Service
public class AIService {

    public static final String APP_ID = "121117508";
    public static final String API_KEY = "wRdtMM5oyZA7ElnCXTd8WR6N";
    public static final String SECRET_KEY = "pPvK7TUIAyQ2rQza8Bgxin9lHfibDDfj";

    // 定义两个阈值
    private static final double STRICT_THRESHOLD = 0.4; // 严格阈值：用于常规筛选
    private static final double MIN_SAFE_THRESHOLD = 0.1; // 熔断阈值：低于这个分数的绝对不要，太离谱了

    private final AipImageClassify client;

    public AIService() {
        client = new AipImageClassify(APP_ID, API_KEY, SECRET_KEY);
        client.setConnectionTimeoutInMillis(2000);
        client.setSocketTimeoutInMillis(60000);
    }

    /**
     * 内部简单类，用于暂存 AI 返回的原始数据方便排序和筛选
     */
    private static class TagCandidate {
        String keyword;
        double score;

        public TagCandidate(String keyword, double score) {
            this.keyword = keyword;
            this.score = score;
        }
    }

    // 替换 detectImageTags 方法
    public List<String> detectImageTags(String localFilePath) {
        List<String> finalTags = new ArrayList<>();
        try {
            JSONObject res = client.advancedGeneral(localFilePath, new HashMap<>());

            // 【关键】打印日志，看看百度到底返给你什么了！
            System.out.println("----- 百度AI 原始返回 -----");
            if (res.has("result")) {
                JSONArray list = res.getJSONArray("result");
                for(int i=0; i<list.length(); i++){
                    JSONObject item = list.getJSONObject(i);
                    System.out.println(item.getString("keyword") + " : " + item.getDouble("score"));
                }
            }
            System.out.println("-------------------------");

            if (res.has("result")) {
                JSONArray resultArray = res.getJSONArray("result");
                List<JSONObject> candidates = new ArrayList<>();
                int limit = Math.min(resultArray.length(), 5);

                // 1. 提取前5个
                for (int i = 0; i < limit; i++) {
                    candidates.add(resultArray.getJSONObject(i));
                }

                // 2. 策略A：优先找高置信度 (> 0.4)
                for (JSONObject item : candidates) {
                    if (item.getDouble("score") > 0.4) {
                        finalTags.add(item.getString("keyword"));
                    }
                }

                // 3. 策略B (保底)：如果策略A一个都没找到，就强制取前2个 (只要 > 0.1)
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
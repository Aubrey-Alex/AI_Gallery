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

    // 【请替换为你自己的 Key】
    // 实际开发中建议放在 application.yml 里，这里为了简单直接写死
    public static final String APP_ID = "121117508";
    public static final String API_KEY = "wRdtMM5oyZA7ElnCXTd8WR6N";
    public static final String SECRET_KEY = "pPvK7TUIAyQ2rQza8Bgxin9lHfibDDfj";

    private final AipImageClassify client;

    public AIService() {
        // 初始化客户端
        client = new AipImageClassify(APP_ID, API_KEY, SECRET_KEY);

        // 可选：设置网络连接参数
        client.setConnectionTimeoutInMillis(2000);
        client.setSocketTimeoutInMillis(60000);
    }

    /**
     * 调用百度 AI 识别图片内容
     * @param localFilePath 图片在服务器上的本地绝对路径
     * @return 识别出的标签列表 (例如 ["猫", "动物", "家宠"])
     */
    public List<String> detectImageTags(String localFilePath) {
        List<String> tags = new ArrayList<>();
        try {
            JSONObject res = client.advancedGeneral(localFilePath, new HashMap<>());

            // 【调试】打印百度返回的完整 JSON，看看里面到底有没有东西
            System.out.println("百度AI 原始响应: " + res.toString(2));

            if (res.has("result")) {
                JSONArray resultArray = res.getJSONArray("result");
                int limit = Math.min(resultArray.length(), 5); // 取前5个

                for (int i = 0; i < limit; i++) {
                    JSONObject item = resultArray.getJSONObject(i);
                    String keyword = item.getString("keyword");
                    double score = item.getDouble("score");

                    // 【调试】打印每个候选词的得分
                    System.out.println("候选标签: " + keyword + " (得分: " + score + ")");

                    // 【修改】把阈值从 0.5 降到 0.1，只要沾边就留着
                    if (score > 0.4) {
                        tags.add(keyword);
                    }
                }
            } else {
                System.err.println("AI响应中没有 result 字段: " + res.toString());
            }
        } catch (Exception e) {
            e.printStackTrace(); // 打印完整堆栈
        }
        return tags;
    }
}
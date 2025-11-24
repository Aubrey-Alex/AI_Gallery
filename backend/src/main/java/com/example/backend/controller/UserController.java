package com.example.backend.controller;

import com.example.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user") // 接口前缀
@CrossOrigin // 【关键】允许前端跨域访问
public class UserController {

    @Autowired
    private UserService userService;

    // 测试接口：浏览器访问 /api/user/hello 就能看到
    @GetMapping("/hello")
    public String hello() {
        return "后端服务已启动！AI Gallery Ready!";
    }

    // 登录接口
    @PostMapping("/login")
    public String login(@RequestBody Map<String, String> params) {
        String username = params.get("username");
        String password = params.get("password");
        return userService.login(username, password);
    }
}
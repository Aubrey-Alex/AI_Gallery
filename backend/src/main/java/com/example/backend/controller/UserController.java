package com.example.backend.controller;

import com.example.backend.entity.SysUser;
import com.example.backend.service.UserService;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
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

    // 注册接口
    // 【修改后】带有唯一性检查的注册接口
    @PostMapping("/register")
    public String register(@RequestBody SysUser user) {
        // 0. 基础非空校验（防止前端传空值）
        if (user.getUsername() == null || user.getEmail() == null) {
            return "注册失败：信息不完整";
        }

        // 1. 检查用户名是否已存在
        QueryWrapper<SysUser> queryWrapper = new QueryWrapper<>();
        // SQL 逻辑: SELECT * FROM sys_user WHERE username = 'xxx' OR email = 'yyy'
        queryWrapper.eq("username", user.getUsername())
                .or()
                .eq("email", user.getEmail());

        // 使用 MyBatis-Plus 的 count 方法查数量
        long count = userService.count(queryWrapper);

        if (count > 0) {
            // 2. 如果查到了记录，说明占用了
            return "注册失败：用户名或邮箱已被注册";
        }

        // 3. 设置默认角色 (双重保险)
        if (user.getRole() == null) {
            user.setRole("USER");
        }

        // 4. 执行保存
        boolean success = userService.save(user);

        if (success) {
            return "注册成功";
        } else {
            return "注册失败：系统错误";
        }
    }
}
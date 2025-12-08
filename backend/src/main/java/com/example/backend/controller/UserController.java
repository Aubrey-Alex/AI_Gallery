package com.example.backend.controller;

import com.example.backend.entity.SysUser;
import com.example.backend.service.UserService;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@CrossOrigin
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // 测试接口：浏览器访问 /api/user/hello 就能看到
    @GetMapping("/hello")
    public String hello() {
        return "后端服务已启动！AI Gallery Ready!";
    }

    // 登录接口
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> params) {
        String username = params.get("username");
        String password = params.get("password");
        return userService.login(username, password);
    }

    // 注册接口
    @PostMapping("/register")
    public String register(@RequestBody SysUser user) {
        // 1. 基础非空校验
        if (user.getUsername() == null || user.getPassword() == null || user.getEmail() == null) {
            return "注册失败：信息不完整";
        }

        // 2. 长度验证 (要求 > 6)
        if (user.getUsername().length() <= 6) {
            return "注册失败：用户名长度必须大于6位";
        }
        if (user.getPassword().length() <= 6) {
            return "注册失败：密码长度必须大于6位";
        }

        // 3. Email 格式验证
        String emailRegex = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
        if (!user.getEmail().matches(emailRegex)) {
            return "注册失败：邮箱格式不正确";
        }

        // 4. 唯一性检查 (用户名和邮箱必须唯一)
        QueryWrapper<SysUser> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("username", user.getUsername())
                .or()
                .eq("email", user.getEmail());

        long count = userService.count(queryWrapper);

        if (count > 0) {
            return "注册失败：用户名或邮箱已被占用";
        }

        // 5. 加密密码并覆盖存储
        String rawPassword = user.getPassword();

        // 使用 BCrypt 对密码进行哈希
        String encodedPassword = passwordEncoder.encode(rawPassword);
        user.setPassword(encodedPassword);

        // 6. 设置默认角色
        if (user.getRole() == null) {
            user.setRole("USER");
        }

        // 7. 执行保存
        boolean success = userService.save(user);

        if (success) {
            return "注册成功";
        } else {
            return "注册失败：系统错误";
        }
    }
}
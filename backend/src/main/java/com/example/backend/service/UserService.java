package com.example.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.backend.entity.SysUser;
import com.example.backend.mapper.UserMapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.backend.utils.JWTUtils; // 【新增】导入 JWT 工具类
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder; // 【新增】导入密码编码器
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class UserService extends ServiceImpl<UserMapper, SysUser>{

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Map<String, Object> login(String username, String password) {
        // 用于存储返回结果
        Map<String, Object> result = new HashMap<>();

        // 1. 构造查询条件: select * from sys_user where username = ?
        QueryWrapper<SysUser> query = new QueryWrapper<>();
        query.eq("username", username);

        // 2. 查询
        SysUser user = userMapper.selectOne(query);

        // 3. 判断
        if (user == null) {
            result.put("msg", "用户不存在");
            return result;
        }

        // 4. 使用 passwordEncoder 校验 BCrypt 密码
        if (!passwordEncoder.matches(password, user.getPassword())) {
            result.put("msg", "密码错误");
            return result;
        }

        // 5. 登录成功：生成 JWT Token
        String role = user.getRole() != null ? user.getRole() : "USER";
        String token = JWTUtils.generateToken(user.getId(), user.getRole());

        // 6. 返回成功信息和 Token
        result.put("msg", "登录成功");
        result.put("token", token);
        result.put("username", user.getUsername());
        result.put("userId", user.getId());

        return result;
    }
}
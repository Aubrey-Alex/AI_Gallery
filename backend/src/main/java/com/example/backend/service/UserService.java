package com.example.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.backend.entity.SysUser;
import com.example.backend.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.security.crypto.password.PasswordEncoder; // 【新增】导入加密器

@Service
public class UserService extends ServiceImpl<UserMapper, SysUser>{

    @Autowired
    private UserMapper userMapper;

    @Autowired // 【新增】注入 PasswordEncoder
    private PasswordEncoder passwordEncoder;

    public String login(String username, String rawPassword) { // 将参数名改为 rawPassword 区分
        // 1. 构造查询条件
        QueryWrapper<SysUser> query = new QueryWrapper<>();
        query.eq("username", username);

        // 2. 查询
        SysUser user = userMapper.selectOne(query);

        // 3. 判断用户是否存在
        if (user == null) {
            return "用户不存在";
        }

        // 4. 【核心修改 B】使用 BCryptPasswordEncoder.matches() 进行验证
        // 参数1: 用户输入的明文密码; 参数2: 数据库中的哈希密码
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            return "密码错误";
        }

        // 5. 验证通过
        return "登录成功";
    }
}
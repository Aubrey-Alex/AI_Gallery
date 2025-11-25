package com.example.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.backend.entity.SysUser;
import com.example.backend.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;

@Service
public class UserService extends ServiceImpl<UserMapper, SysUser>{

    @Autowired
    private UserMapper userMapper;

    public String login(String username, String password) {
        // 1. 构造查询条件: select * from sys_user where username = ?
        QueryWrapper<SysUser> query = new QueryWrapper<>();
        query.eq("username", username);

        // 2. 查询
        SysUser user = userMapper.selectOne(query);

        // 3. 判断
        if (user == null) {
            return "用户不存在";
        }
        if (!user.getPassword().equals(password)) {
            return "密码错误";
        }
        return "登录成功";
    }
}
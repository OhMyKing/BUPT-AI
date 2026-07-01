package com.ruoyi.admim_api.service.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.admim_api.mapper.adminTaskinfoMapper;
import com.ruoyi.admim_api.domain.adminTaskinfo;
import com.ruoyi.admim_api.service.IadminTaskinfoService;

/**
 * 测试任务管理Service业务层处理
 * 
 * @author ruoyi
 * @date 2024-06-20
 */
@Service
public class adminTaskinfoServiceImpl implements IadminTaskinfoService 
{
    @Autowired
    private adminTaskinfoMapper adminTaskinfoMapper;

    /**
     * 查询测试任务管理
     * 
     * @param taskId 测试任务管理主键
     * @return 测试任务管理
     */
    @Override
    public adminTaskinfo selectadminTaskinfoByTaskId(Long taskId)
    {
        return adminTaskinfoMapper.selectadminTaskinfoByTaskId(taskId);
    }

    /**
     * 查询测试任务管理列表
     * 
     * @param adminTaskinfo 测试任务管理
     * @return 测试任务管理
     */
    @Override
    public List<adminTaskinfo> selectadminTaskinfoList(adminTaskinfo adminTaskinfo)
    {
        return adminTaskinfoMapper.selectadminTaskinfoList(adminTaskinfo);
    }

    /**
     * 新增测试任务管理
     * 
     * @param adminTaskinfo 测试任务管理
     * @return 结果
     */
    @Override
    public int insertadminTaskinfo(adminTaskinfo adminTaskinfo)
    {
        return adminTaskinfoMapper.insertadminTaskinfo(adminTaskinfo);
    }

    /**
     * 修改测试任务管理
     * 
     * @param adminTaskinfo 测试任务管理
     * @return 结果
     */
    @Override
    public int updateadminTaskinfo(adminTaskinfo adminTaskinfo)
    {
        return adminTaskinfoMapper.updateadminTaskinfo(adminTaskinfo);
    }

    /**
     * 批量删除测试任务管理
     * 
     * @param taskIds 需要删除的测试任务管理主键
     * @return 结果
     */
    @Override
    public int deleteadminTaskinfoByTaskIds(Long[] taskIds)
    {
        return adminTaskinfoMapper.deleteadminTaskinfoByTaskIds(taskIds);
    }

    /**
     * 删除测试任务管理信息
     * 
     * @param taskId 测试任务管理主键
     * @return 结果
     */
    @Override
    public int deleteadminTaskinfoByTaskId(Long taskId)
    {
        return adminTaskinfoMapper.deleteadminTaskinfoByTaskId(taskId);
    }
}

package com.ruoyi.admim_api.mapper;

import java.util.List;
import com.ruoyi.admim_api.domain.adminTaskinfo;

/**
 * 测试任务管理Mapper接口
 * 
 * @author ruoyi
 * @date 2024-06-20
 */
public interface adminTaskinfoMapper 
{
    /**
     * 查询测试任务管理
     * 
     * @param taskId 测试任务管理主键
     * @return 测试任务管理
     */
    public adminTaskinfo selectadminTaskinfoByTaskId(Long taskId);

    /**
     * 查询测试任务管理列表
     * 
     * @param adminTaskinfo 测试任务管理
     * @return 测试任务管理集合
     */
    public List<adminTaskinfo> selectadminTaskinfoList(adminTaskinfo adminTaskinfo);

    /**
     * 新增测试任务管理
     * 
     * @param adminTaskinfo 测试任务管理
     * @return 结果
     */
    public int insertadminTaskinfo(adminTaskinfo adminTaskinfo);

    /**
     * 修改测试任务管理
     * 
     * @param adminTaskinfo 测试任务管理
     * @return 结果
     */
    public int updateadminTaskinfo(adminTaskinfo adminTaskinfo);

    /**
     * 删除测试任务管理
     * 
     * @param taskId 测试任务管理主键
     * @return 结果
     */
    public int deleteadminTaskinfoByTaskId(Long taskId);

    /**
     * 批量删除测试任务管理
     * 
     * @param taskIds 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteadminTaskinfoByTaskIds(Long[] taskIds);
}

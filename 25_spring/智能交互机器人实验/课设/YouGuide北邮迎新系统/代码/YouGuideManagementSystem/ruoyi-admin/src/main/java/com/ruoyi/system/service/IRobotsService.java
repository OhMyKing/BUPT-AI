package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.Robots;

/**
 * 机器人管理Service接口
 * 
 * @author ruoyi
 * @date 2025-05-23
 */
public interface IRobotsService 
{
    /**
     * 查询机器人管理
     * 
     * @param robotId 机器人管理主键
     * @return 机器人管理
     */
    public Robots selectRobotsByRobotId(String robotId);

    /**
     * 查询机器人管理列表
     * 
     * @param robots 机器人管理
     * @return 机器人管理集合
     */
    public List<Robots> selectRobotsList(Robots robots);

    /**
     * 新增机器人管理
     * 
     * @param robots 机器人管理
     * @return 结果
     */
    public int insertRobots(Robots robots);

    /**
     * 修改机器人管理
     * 
     * @param robots 机器人管理
     * @return 结果
     */
    public int updateRobots(Robots robots);

    /**
     * 批量删除机器人管理
     * 
     * @param robotIds 需要删除的机器人管理主键集合
     * @return 结果
     */
    public int deleteRobotsByRobotIds(String[] robotIds);

    /**
     * 删除机器人管理信息
     * 
     * @param robotId 机器人管理主键
     * @return 结果
     */
    public int deleteRobotsByRobotId(String robotId);
}

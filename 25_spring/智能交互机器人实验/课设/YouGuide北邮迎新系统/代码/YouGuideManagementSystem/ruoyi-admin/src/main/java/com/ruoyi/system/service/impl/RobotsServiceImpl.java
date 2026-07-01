package com.ruoyi.system.service.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.RobotsMapper;
import com.ruoyi.system.domain.Robots;
import com.ruoyi.system.service.IRobotsService;

/**
 * 机器人管理Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-05-23
 */
@Service
public class RobotsServiceImpl implements IRobotsService 
{
    @Autowired
    private RobotsMapper robotsMapper;

    /**
     * 查询机器人管理
     * 
     * @param robotId 机器人管理主键
     * @return 机器人管理
     */
    @Override
    public Robots selectRobotsByRobotId(String robotId)
    {
        return robotsMapper.selectRobotsByRobotId(robotId);
    }

    /**
     * 查询机器人管理列表
     * 
     * @param robots 机器人管理
     * @return 机器人管理
     */
    @Override
    public List<Robots> selectRobotsList(Robots robots)
    {
        return robotsMapper.selectRobotsList(robots);
    }

    /**
     * 新增机器人管理
     * 
     * @param robots 机器人管理
     * @return 结果
     */
    @Override
    public int insertRobots(Robots robots)
    {
        return robotsMapper.insertRobots(robots);
    }

    /**
     * 修改机器人管理
     * 
     * @param robots 机器人管理
     * @return 结果
     */
    @Override
    public int updateRobots(Robots robots)
    {
        return robotsMapper.updateRobots(robots);
    }

    /**
     * 批量删除机器人管理
     * 
     * @param robotIds 需要删除的机器人管理主键
     * @return 结果
     */
    @Override
    public int deleteRobotsByRobotIds(String[] robotIds)
    {
        return robotsMapper.deleteRobotsByRobotIds(robotIds);
    }

    /**
     * 删除机器人管理信息
     * 
     * @param robotId 机器人管理主键
     * @return 结果
     */
    @Override
    public int deleteRobotsByRobotId(String robotId)
    {
        return robotsMapper.deleteRobotsByRobotId(robotId);
    }
}

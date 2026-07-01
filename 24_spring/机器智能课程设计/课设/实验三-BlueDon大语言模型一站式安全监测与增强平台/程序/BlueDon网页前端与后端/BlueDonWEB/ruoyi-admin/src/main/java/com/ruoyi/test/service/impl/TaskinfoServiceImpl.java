package com.ruoyi.test.service.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.test.mapper.TaskinfoMapper;
import com.ruoyi.test.domain.Taskinfo;
import com.ruoyi.test.service.ITaskinfoService;

/**
 * 大语言模型测试任务Service业务层处理
 * 
 * @author ruoyi
 * @date 2024-06-20
 */
@Service
public class TaskinfoServiceImpl implements ITaskinfoService 
{
    @Autowired
    private TaskinfoMapper taskinfoMapper;

    /**
     * 查询大语言模型测试任务
     * 
     * @param taskId 大语言模型测试任务主键
     * @return 大语言模型测试任务
     */
    @Override
    public Taskinfo selectTaskinfoByTaskId(Long taskId)
    {
        return taskinfoMapper.selectTaskinfoByTaskId(taskId);
    }

    /**
     * 查询大语言模型测试任务列表
     * 
     * @param taskinfo 大语言模型测试任务
     * @return 大语言模型测试任务
     */
    @Override
    public List<Taskinfo> selectTaskinfoList(Taskinfo taskinfo)
    {
        return taskinfoMapper.selectTaskinfoList(taskinfo);
    }

    /**
     * 新增大语言模型测试任务
     * 
     * @param taskinfo 大语言模型测试任务
     * @return 结果
     */
    @Override
    public int insertTaskinfo(Taskinfo taskinfo)
    {
        return taskinfoMapper.insertTaskinfo(taskinfo);
    }

    /**
     * 修改大语言模型测试任务
     * 
     * @param taskinfo 大语言模型测试任务
     * @return 结果
     */
    @Override
    public int updateTaskinfo(Taskinfo taskinfo)
    {
        return taskinfoMapper.updateTaskinfo(taskinfo);
    }

    /**
     * 批量删除大语言模型测试任务
     * 
     * @param taskIds 需要删除的大语言模型测试任务主键
     * @return 结果
     */
    @Override
    public int deleteTaskinfoByTaskIds(Long[] taskIds)
    {
        return taskinfoMapper.deleteTaskinfoByTaskIds(taskIds);
    }

    /**
     * 删除大语言模型测试任务信息
     * 
     * @param taskId 大语言模型测试任务主键
     * @return 结果
     */
    @Override
    public int deleteTaskinfoByTaskId(Long taskId)
    {
        return taskinfoMapper.deleteTaskinfoByTaskId(taskId);
    }
}

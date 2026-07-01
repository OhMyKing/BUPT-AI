package com.ruoyi.test.mapper;

import java.util.List;
import com.ruoyi.test.domain.Taskinfo;

/**
 * 大语言模型测试任务Mapper接口
 * 
 * @author ruoyi
 * @date 2024-06-20
 */
public interface TaskinfoMapper 
{
    /**
     * 查询大语言模型测试任务
     * 
     * @param taskId 大语言模型测试任务主键
     * @return 大语言模型测试任务
     */
    public Taskinfo selectTaskinfoByTaskId(Long taskId);

    /**
     * 查询大语言模型测试任务列表
     * 
     * @param taskinfo 大语言模型测试任务
     * @return 大语言模型测试任务集合
     */
    public List<Taskinfo> selectTaskinfoList(Taskinfo taskinfo);

    /**
     * 新增大语言模型测试任务
     * 
     * @param taskinfo 大语言模型测试任务
     * @return 结果
     */
    public int insertTaskinfo(Taskinfo taskinfo);

    /**
     * 修改大语言模型测试任务
     * 
     * @param taskinfo 大语言模型测试任务
     * @return 结果
     */
    public int updateTaskinfo(Taskinfo taskinfo);

    /**
     * 删除大语言模型测试任务
     * 
     * @param taskId 大语言模型测试任务主键
     * @return 结果
     */
    public int deleteTaskinfoByTaskId(Long taskId);

    /**
     * 批量删除大语言模型测试任务
     * 
     * @param taskIds 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteTaskinfoByTaskIds(Long[] taskIds);
}

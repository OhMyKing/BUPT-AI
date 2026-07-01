package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.system.domain.Volunteers;

/**
 * 志愿者信息管理Mapper接口
 * 
 * @author ruoyi
 * @date 2025-05-23
 */
public interface VolunteersMapper 
{
    /**
     * 查询志愿者信息管理
     * 
     * @param volunteerId 志愿者信息管理主键
     * @return 志愿者信息管理
     */
    public Volunteers selectVolunteersByVolunteerId(String volunteerId);

    /**
     * 查询志愿者信息管理列表
     * 
     * @param volunteers 志愿者信息管理
     * @return 志愿者信息管理集合
     */
    public List<Volunteers> selectVolunteersList(Volunteers volunteers);

    /**
     * 新增志愿者信息管理
     * 
     * @param volunteers 志愿者信息管理
     * @return 结果
     */
    public int insertVolunteers(Volunteers volunteers);

    /**
     * 修改志愿者信息管理
     * 
     * @param volunteers 志愿者信息管理
     * @return 结果
     */
    public int updateVolunteers(Volunteers volunteers);

    /**
     * 删除志愿者信息管理
     * 
     * @param volunteerId 志愿者信息管理主键
     * @return 结果
     */
    public int deleteVolunteersByVolunteerId(String volunteerId);

    /**
     * 批量删除志愿者信息管理
     * 
     * @param volunteerIds 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteVolunteersByVolunteerIds(String[] volunteerIds);
}

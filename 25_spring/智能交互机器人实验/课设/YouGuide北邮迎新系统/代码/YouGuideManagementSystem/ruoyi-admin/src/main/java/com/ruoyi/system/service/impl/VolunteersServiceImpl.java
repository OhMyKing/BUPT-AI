package com.ruoyi.system.service.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.VolunteersMapper;
import com.ruoyi.system.domain.Volunteers;
import com.ruoyi.system.service.IVolunteersService;

/**
 * 志愿者信息管理Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-05-23
 */
@Service
public class VolunteersServiceImpl implements IVolunteersService 
{
    @Autowired
    private VolunteersMapper volunteersMapper;

    /**
     * 查询志愿者信息管理
     * 
     * @param volunteerId 志愿者信息管理主键
     * @return 志愿者信息管理
     */
    @Override
    public Volunteers selectVolunteersByVolunteerId(String volunteerId)
    {
        return volunteersMapper.selectVolunteersByVolunteerId(volunteerId);
    }

    /**
     * 查询志愿者信息管理列表
     * 
     * @param volunteers 志愿者信息管理
     * @return 志愿者信息管理
     */
    @Override
    public List<Volunteers> selectVolunteersList(Volunteers volunteers)
    {
        return volunteersMapper.selectVolunteersList(volunteers);
    }

    /**
     * 新增志愿者信息管理
     * 
     * @param volunteers 志愿者信息管理
     * @return 结果
     */
    @Override
    public int insertVolunteers(Volunteers volunteers)
    {
        return volunteersMapper.insertVolunteers(volunteers);
    }

    /**
     * 修改志愿者信息管理
     * 
     * @param volunteers 志愿者信息管理
     * @return 结果
     */
    @Override
    public int updateVolunteers(Volunteers volunteers)
    {
        return volunteersMapper.updateVolunteers(volunteers);
    }

    /**
     * 批量删除志愿者信息管理
     * 
     * @param volunteerIds 需要删除的志愿者信息管理主键
     * @return 结果
     */
    @Override
    public int deleteVolunteersByVolunteerIds(String[] volunteerIds)
    {
        return volunteersMapper.deleteVolunteersByVolunteerIds(volunteerIds);
    }

    /**
     * 删除志愿者信息管理信息
     * 
     * @param volunteerId 志愿者信息管理主键
     * @return 结果
     */
    @Override
    public int deleteVolunteersByVolunteerId(String volunteerId)
    {
        return volunteersMapper.deleteVolunteersByVolunteerId(volunteerId);
    }
}

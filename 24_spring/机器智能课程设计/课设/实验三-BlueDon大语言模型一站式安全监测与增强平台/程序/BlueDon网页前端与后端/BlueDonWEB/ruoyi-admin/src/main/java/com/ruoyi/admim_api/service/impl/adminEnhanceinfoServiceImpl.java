package com.ruoyi.admim_api.service.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.admim_api.mapper.adminEnhanceinfoMapper;
import com.ruoyi.admim_api.domain.adminEnhanceinfo;
import com.ruoyi.admim_api.service.IadminEnhanceinfoService;

/**
 * 增强API管理Service业务层处理
 * 
 * @author ruoyi
 * @date 2024-06-20
 */
@Service
public class adminEnhanceinfoServiceImpl implements IadminEnhanceinfoService 
{
    @Autowired
    private adminEnhanceinfoMapper adminEnhanceinfoMapper;

    /**
     * 查询增强API管理
     * 
     * @param enhancementApiId 增强API管理主键
     * @return 增强API管理
     */
    @Override
    public adminEnhanceinfo selectadminEnhanceinfoByEnhancementApiId(Long enhancementApiId)
    {
        return adminEnhanceinfoMapper.selectadminEnhanceinfoByEnhancementApiId(enhancementApiId);
    }

    /**
     * 查询增强API管理列表
     * 
     * @param adminEnhanceinfo 增强API管理
     * @return 增强API管理
     */
    @Override
    public List<adminEnhanceinfo> selectadminEnhanceinfoList(adminEnhanceinfo adminEnhanceinfo)
    {
        return adminEnhanceinfoMapper.selectadminEnhanceinfoList(adminEnhanceinfo);
    }

    /**
     * 新增增强API管理
     * 
     * @param adminEnhanceinfo 增强API管理
     * @return 结果
     */
    @Override
    public int insertadminEnhanceinfo(adminEnhanceinfo adminEnhanceinfo)
    {
        return adminEnhanceinfoMapper.insertadminEnhanceinfo(adminEnhanceinfo);
    }

    /**
     * 修改增强API管理
     * 
     * @param adminEnhanceinfo 增强API管理
     * @return 结果
     */
    @Override
    public int updateadminEnhanceinfo(adminEnhanceinfo adminEnhanceinfo)
    {
        return adminEnhanceinfoMapper.updateadminEnhanceinfo(adminEnhanceinfo);
    }

    /**
     * 批量删除增强API管理
     * 
     * @param enhancementApiIds 需要删除的增强API管理主键
     * @return 结果
     */
    @Override
    public int deleteadminEnhanceinfoByEnhancementApiIds(Long[] enhancementApiIds)
    {
        return adminEnhanceinfoMapper.deleteadminEnhanceinfoByEnhancementApiIds(enhancementApiIds);
    }

    /**
     * 删除增强API管理信息
     * 
     * @param enhancementApiId 增强API管理主键
     * @return 结果
     */
    @Override
    public int deleteadminEnhanceinfoByEnhancementApiId(Long enhancementApiId)
    {
        return adminEnhanceinfoMapper.deleteadminEnhanceinfoByEnhancementApiId(enhancementApiId);
    }
}

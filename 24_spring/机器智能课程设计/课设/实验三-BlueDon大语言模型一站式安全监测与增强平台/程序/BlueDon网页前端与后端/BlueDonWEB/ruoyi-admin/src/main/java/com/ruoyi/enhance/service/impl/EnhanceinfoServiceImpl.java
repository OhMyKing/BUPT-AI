package com.ruoyi.enhance.service.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.enhance.mapper.EnhanceinfoMapper;
import com.ruoyi.enhance.domain.Enhanceinfo;
import com.ruoyi.enhance.service.IEnhanceinfoService;

/**
 * 增强API管理Service业务层处理
 * 
 * @author ruoyi
 * @date 2024-06-20
 */
@Service
public class EnhanceinfoServiceImpl implements IEnhanceinfoService 
{
    @Autowired
    private EnhanceinfoMapper enhanceinfoMapper;

    /**
     * 查询增强API管理
     * 
     * @param enhancementApiId 增强API管理主键
     * @return 增强API管理
     */
    @Override
    public Enhanceinfo selectEnhanceinfoByEnhancementApiId(Long enhancementApiId)
    {
        return enhanceinfoMapper.selectEnhanceinfoByEnhancementApiId(enhancementApiId);
    }

    /**
     * 查询增强API管理列表
     * 
     * @param enhanceinfo 增强API管理
     * @return 增强API管理
     */
    @Override
    public List<Enhanceinfo> selectEnhanceinfoList(Enhanceinfo enhanceinfo)
    {
        return enhanceinfoMapper.selectEnhanceinfoList(enhanceinfo);
    }

    /**
     * 新增增强API管理
     * 
     * @param enhanceinfo 增强API管理
     * @return 结果
     */
    @Override
    public int insertEnhanceinfo(Enhanceinfo enhanceinfo)
    {
        return enhanceinfoMapper.insertEnhanceinfo(enhanceinfo);
    }

    /**
     * 修改增强API管理
     * 
     * @param enhanceinfo 增强API管理
     * @return 结果
     */
    @Override
    public int updateEnhanceinfo(Enhanceinfo enhanceinfo)
    {
        return enhanceinfoMapper.updateEnhanceinfo(enhanceinfo);
    }

    /**
     * 批量删除增强API管理
     * 
     * @param enhancementApiIds 需要删除的增强API管理主键
     * @return 结果
     */
    @Override
    public int deleteEnhanceinfoByEnhancementApiIds(Long[] enhancementApiIds)
    {
        return enhanceinfoMapper.deleteEnhanceinfoByEnhancementApiIds(enhancementApiIds);
    }

    /**
     * 删除增强API管理信息
     * 
     * @param enhancementApiId 增强API管理主键
     * @return 结果
     */
    @Override
    public int deleteEnhanceinfoByEnhancementApiId(Long enhancementApiId)
    {
        return enhanceinfoMapper.deleteEnhanceinfoByEnhancementApiId(enhancementApiId);
    }
}

package com.ruoyi.admim_api.mapper;

import java.util.List;
import com.ruoyi.admim_api.domain.adminEnhanceinfo;

/**
 * 增强API管理Mapper接口
 * 
 * @author ruoyi
 * @date 2024-06-20
 */
public interface adminEnhanceinfoMapper 
{
    /**
     * 查询增强API管理
     * 
     * @param enhancementApiId 增强API管理主键
     * @return 增强API管理
     */
    public adminEnhanceinfo selectadminEnhanceinfoByEnhancementApiId(Long enhancementApiId);

    /**
     * 查询增强API管理列表
     * 
     * @param adminEnhanceinfo 增强API管理
     * @return 增强API管理集合
     */
    public List<adminEnhanceinfo> selectadminEnhanceinfoList(adminEnhanceinfo adminEnhanceinfo);

    /**
     * 新增增强API管理
     * 
     * @param adminEnhanceinfo 增强API管理
     * @return 结果
     */
    public int insertadminEnhanceinfo(adminEnhanceinfo adminEnhanceinfo);

    /**
     * 修改增强API管理
     * 
     * @param adminEnhanceinfo 增强API管理
     * @return 结果
     */
    public int updateadminEnhanceinfo(adminEnhanceinfo adminEnhanceinfo);

    /**
     * 删除增强API管理
     * 
     * @param enhancementApiId 增强API管理主键
     * @return 结果
     */
    public int deleteadminEnhanceinfoByEnhancementApiId(Long enhancementApiId);

    /**
     * 批量删除增强API管理
     * 
     * @param enhancementApiIds 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteadminEnhanceinfoByEnhancementApiIds(Long[] enhancementApiIds);
}

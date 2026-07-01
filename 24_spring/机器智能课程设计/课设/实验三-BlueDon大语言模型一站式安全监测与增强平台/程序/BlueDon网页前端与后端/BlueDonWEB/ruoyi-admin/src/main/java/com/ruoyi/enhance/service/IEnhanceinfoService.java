package com.ruoyi.enhance.service;

import java.util.List;
import com.ruoyi.enhance.domain.Enhanceinfo;

/**
 * 增强API管理Service接口
 * 
 * @author ruoyi
 * @date 2024-06-20
 */
public interface IEnhanceinfoService 
{
    /**
     * 查询增强API管理
     * 
     * @param enhancementApiId 增强API管理主键
     * @return 增强API管理
     */
    public Enhanceinfo selectEnhanceinfoByEnhancementApiId(Long enhancementApiId);

    /**
     * 查询增强API管理列表
     * 
     * @param enhanceinfo 增强API管理
     * @return 增强API管理集合
     */
    public List<Enhanceinfo> selectEnhanceinfoList(Enhanceinfo enhanceinfo);

    /**
     * 新增增强API管理
     * 
     * @param enhanceinfo 增强API管理
     * @return 结果
     */
    public int insertEnhanceinfo(Enhanceinfo enhanceinfo);

    /**
     * 修改增强API管理
     * 
     * @param enhanceinfo 增强API管理
     * @return 结果
     */
    public int updateEnhanceinfo(Enhanceinfo enhanceinfo);

    /**
     * 批量删除增强API管理
     * 
     * @param enhancementApiIds 需要删除的增强API管理主键集合
     * @return 结果
     */
    public int deleteEnhanceinfoByEnhancementApiIds(Long[] enhancementApiIds);

    /**
     * 删除增强API管理信息
     * 
     * @param enhancementApiId 增强API管理主键
     * @return 结果
     */
    public int deleteEnhanceinfoByEnhancementApiId(Long enhancementApiId);
}

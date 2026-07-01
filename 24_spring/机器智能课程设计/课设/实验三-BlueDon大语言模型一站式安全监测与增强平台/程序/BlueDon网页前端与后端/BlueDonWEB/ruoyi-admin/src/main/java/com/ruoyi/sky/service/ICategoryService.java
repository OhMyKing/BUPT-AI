package com.ruoyi.sky.service;

import java.util.List;
import com.ruoyi.sky.domain.Category;

/**
 * 分类管理Service接口
 * 
 * @author ruoyi
 * @date 2024-05-30
 */
public interface ICategoryService 
{
    /**
     * 查询分类管理
     * 
     * @param id 分类管理主键
     * @return 分类管理
     */
    public Category selectCategoryById(Long id);

    /**
     * 查询分类管理列表
     * 
     * @param category 分类管理
     * @return 分类管理集合
     */
    public List<Category> selectCategoryList(Category category);

    /**
     * 新增分类管理
     * 
     * @param category 分类管理
     * @return 结果
     */
    public int insertCategory(Category category);

    /**
     * 修改分类管理
     * 
     * @param category 分类管理
     * @return 结果
     */
    public int updateCategory(Category category);

    /**
     * 批量删除分类管理
     * 
     * @param ids 需要删除的分类管理主键集合
     * @return 结果
     */
    public int deleteCategoryByIds(Long[] ids);

    /**
     * 删除分类管理信息
     * 
     * @param id 分类管理主键
     * @return 结果
     */
    public int deleteCategoryById(Long id);
}

package com.ruoyi.sky.domain;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 菜品口味对象 dish_flavor
 * 
 * @author ruoyi
 * @date 2024-05-30
 */
public class DishFlavor extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** 菜品 */
    @Excel(name = "菜品")
    private Long dishId;

    /** 口味名称 */
    @Excel(name = "口味名称")
    private String name;

    /** 口味数据list */
    @Excel(name = "口味数据list")
    private String value;

    public void setId(Long id) 
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }
    public void setDishId(Long dishId) 
    {
        this.dishId = dishId;
    }

    public Long getDishId() 
    {
        return dishId;
    }
    public void setName(String name) 
    {
        this.name = name;
    }

    public String getName() 
    {
        return name;
    }
    public void setValue(String value) 
    {
        this.value = value;
    }

    public String getValue() 
    {
        return value;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("dishId", getDishId())
            .append("name", getName())
            .append("value", getValue())
            .toString();
    }
}

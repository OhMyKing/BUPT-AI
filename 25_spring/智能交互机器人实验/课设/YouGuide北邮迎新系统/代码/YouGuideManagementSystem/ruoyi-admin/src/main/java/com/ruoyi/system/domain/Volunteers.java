package com.ruoyi.system.domain;

import java.math.BigDecimal;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 志愿者信息管理对象 volunteers
 * 
 * @author ruoyi
 * @date 2025-05-23
 */
public class Volunteers extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 志愿者ID */
    private String volunteerId;

    /** 姓名 */
    @Excel(name = "姓名")
    private String name;

    /** 性别 */
    @Excel(name = "性别")
    private String gender;

    /** 当前纬度 */
    @Excel(name = "当前纬度")
    private BigDecimal currentLatitude;

    /** 当前经度 */
    @Excel(name = "当前经度")
    private BigDecimal currentLongitude;

    public void setVolunteerId(String volunteerId) 
    {
        this.volunteerId = volunteerId;
    }

    public String getVolunteerId() 
    {
        return volunteerId;
    }

    public void setName(String name) 
    {
        this.name = name;
    }

    public String getName() 
    {
        return name;
    }

    public void setGender(String gender) 
    {
        this.gender = gender;
    }

    public String getGender() 
    {
        return gender;
    }

    public void setCurrentLatitude(BigDecimal currentLatitude) 
    {
        this.currentLatitude = currentLatitude;
    }

    public BigDecimal getCurrentLatitude() 
    {
        return currentLatitude;
    }

    public void setCurrentLongitude(BigDecimal currentLongitude) 
    {
        this.currentLongitude = currentLongitude;
    }

    public BigDecimal getCurrentLongitude() 
    {
        return currentLongitude;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("volunteerId", getVolunteerId())
            .append("name", getName())
            .append("gender", getGender())
            .append("currentLatitude", getCurrentLatitude())
            .append("currentLongitude", getCurrentLongitude())
            .toString();
    }
}

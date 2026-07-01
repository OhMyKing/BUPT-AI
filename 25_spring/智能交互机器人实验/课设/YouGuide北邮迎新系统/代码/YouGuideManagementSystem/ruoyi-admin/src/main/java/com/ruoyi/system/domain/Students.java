package com.ruoyi.system.domain;

import java.math.BigDecimal;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 新生管理对象 students
 * 
 * @author ruoyi
 * @date 2025-05-23
 */
public class Students extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 学生ID */
    private Long studentId;

    /** 学号 */
    @Excel(name = "学号")
    private Long studentNum;

    /** 姓名 */
    @Excel(name = "姓名")
    private String name;

    /** 性别 */
    @Excel(name = "性别")
    private String gender;

    /** 学院 */
    @Excel(name = "学院")
    private String college;

    /** 专业 */
    @Excel(name = "专业")
    private String major;

    /** 宿舍楼 */
    @Excel(name = "宿舍楼")
    private Long dormitoryId;

    /** 宿舍号 */
    @Excel(name = "宿舍号")
    private String dormitoryNo;

    /** 电话 */
    @Excel(name = "电话")
    private String phone;

    /** 微信 */
    @Excel(name = "微信")
    private String wechatEnterpriseId;

    /** 报道进度 */
    @Excel(name = "报道进度")
    private Long flowPositionId;

    /** 当前经度 */
    @Excel(name = "当前经度")
    private BigDecimal currentLatitude;

    /** 当前纬度 */
    @Excel(name = "当前纬度")
    private BigDecimal currentLongitude;

    public void setStudentId(Long studentId) 
    {
        this.studentId = studentId;
    }

    public Long getStudentId() 
    {
        return studentId;
    }

    public void setStudentNum(Long studentNum) 
    {
        this.studentNum = studentNum;
    }

    public Long getStudentNum() 
    {
        return studentNum;
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

    public void setCollege(String college) 
    {
        this.college = college;
    }

    public String getCollege() 
    {
        return college;
    }

    public void setMajor(String major) 
    {
        this.major = major;
    }

    public String getMajor() 
    {
        return major;
    }

    public void setDormitoryId(Long dormitoryId) 
    {
        this.dormitoryId = dormitoryId;
    }

    public Long getDormitoryId() 
    {
        return dormitoryId;
    }

    public void setDormitoryNo(String dormitoryNo) 
    {
        this.dormitoryNo = dormitoryNo;
    }

    public String getDormitoryNo() 
    {
        return dormitoryNo;
    }

    public void setPhone(String phone) 
    {
        this.phone = phone;
    }

    public String getPhone() 
    {
        return phone;
    }

    public void setWechatEnterpriseId(String wechatEnterpriseId) 
    {
        this.wechatEnterpriseId = wechatEnterpriseId;
    }

    public String getWechatEnterpriseId() 
    {
        return wechatEnterpriseId;
    }

    public void setFlowPositionId(Long flowPositionId) 
    {
        this.flowPositionId = flowPositionId;
    }

    public Long getFlowPositionId() 
    {
        return flowPositionId;
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
            .append("studentId", getStudentId())
            .append("studentNum", getStudentNum())
            .append("name", getName())
            .append("gender", getGender())
            .append("college", getCollege())
            .append("major", getMajor())
            .append("dormitoryId", getDormitoryId())
            .append("dormitoryNo", getDormitoryNo())
            .append("phone", getPhone())
            .append("wechatEnterpriseId", getWechatEnterpriseId())
            .append("flowPositionId", getFlowPositionId())
            .append("currentLatitude", getCurrentLatitude())
            .append("currentLongitude", getCurrentLongitude())
            .toString();
    }
}

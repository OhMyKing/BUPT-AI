package com.ruoyi.system.domain;

import java.math.BigDecimal;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 机器人管理对象 robots
 * 
 * @author ruoyi
 * @date 2025-05-23
 */
public class Robots extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 机器人ID */
    private String robotId;

    /** 电量 */
    @Excel(name = "电量")
    private Long batteryLevel;

    /** 状态 */
    @Excel(name = "状态")
    private Long healthStateId;

    /** 类型 */
    @Excel(name = "类型")
    private Long robotTypeId;

    /** 当前纬度 */
    @Excel(name = "当前纬度")
    private BigDecimal currentLatitude;

    /** 当前经度 */
    @Excel(name = "当前经度")
    private BigDecimal currentLongitude;

    /** 目标维度 */
    @Excel(name = "目标维度")
    private BigDecimal targetLatitude;

    /** 目标经度 */
    @Excel(name = "目标经度")
    private BigDecimal targetLongitude;

    /** 目标地点 */
    @Excel(name = "目标地点")
    private Long targetPositionId;

    /** 流程进度 */
    @Excel(name = "流程进度")
    private Long flowPositionId;

    /** 跟随新生 */
    @Excel(name = "跟随新生")
    private String followingStudentId;

    /** 通信地址 */
    @Excel(name = "通信地址")
    private String communicationUrl;

    /** 控制秘钥 */
    @Excel(name = "控制秘钥")
    private String controlKey;

    public void setRobotId(String robotId) 
    {
        this.robotId = robotId;
    }

    public String getRobotId() 
    {
        return robotId;
    }

    public void setBatteryLevel(Long batteryLevel) 
    {
        this.batteryLevel = batteryLevel;
    }

    public Long getBatteryLevel() 
    {
        return batteryLevel;
    }

    public void setHealthStateId(Long healthStateId) 
    {
        this.healthStateId = healthStateId;
    }

    public Long getHealthStateId() 
    {
        return healthStateId;
    }

    public void setRobotTypeId(Long robotTypeId) 
    {
        this.robotTypeId = robotTypeId;
    }

    public Long getRobotTypeId() 
    {
        return robotTypeId;
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

    public void setTargetLatitude(BigDecimal targetLatitude) 
    {
        this.targetLatitude = targetLatitude;
    }

    public BigDecimal getTargetLatitude() 
    {
        return targetLatitude;
    }

    public void setTargetLongitude(BigDecimal targetLongitude) 
    {
        this.targetLongitude = targetLongitude;
    }

    public BigDecimal getTargetLongitude() 
    {
        return targetLongitude;
    }

    public void setTargetPositionId(Long targetPositionId) 
    {
        this.targetPositionId = targetPositionId;
    }

    public Long getTargetPositionId() 
    {
        return targetPositionId;
    }

    public void setFlowPositionId(Long flowPositionId) 
    {
        this.flowPositionId = flowPositionId;
    }

    public Long getFlowPositionId() 
    {
        return flowPositionId;
    }

    public void setFollowingStudentId(String followingStudentId) 
    {
        this.followingStudentId = followingStudentId;
    }

    public String getFollowingStudentId() 
    {
        return followingStudentId;
    }

    public void setCommunicationUrl(String communicationUrl) 
    {
        this.communicationUrl = communicationUrl;
    }

    public String getCommunicationUrl() 
    {
        return communicationUrl;
    }

    public void setControlKey(String controlKey) 
    {
        this.controlKey = controlKey;
    }

    public String getControlKey() 
    {
        return controlKey;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("robotId", getRobotId())
            .append("batteryLevel", getBatteryLevel())
            .append("healthStateId", getHealthStateId())
            .append("robotTypeId", getRobotTypeId())
            .append("currentLatitude", getCurrentLatitude())
            .append("currentLongitude", getCurrentLongitude())
            .append("targetLatitude", getTargetLatitude())
            .append("targetLongitude", getTargetLongitude())
            .append("targetPositionId", getTargetPositionId())
            .append("flowPositionId", getFlowPositionId())
            .append("followingStudentId", getFollowingStudentId())
            .append("communicationUrl", getCommunicationUrl())
            .append("controlKey", getControlKey())
            .toString();
    }
}

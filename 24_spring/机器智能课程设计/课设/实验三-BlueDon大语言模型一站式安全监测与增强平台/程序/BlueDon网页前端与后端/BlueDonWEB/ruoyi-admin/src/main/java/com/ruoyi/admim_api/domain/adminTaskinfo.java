package com.ruoyi.admim_api.domain;

import java.util.Date;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 测试任务管理对象 taskinfo
 * 
 * @author ruoyi
 * @date 2024-06-20
 */
public class adminTaskinfo extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 任务唯一标识 */
    private Long taskId;

    /** 模型名称 */
    @Excel(name = "模型名称")
    private String modelName;

    /** 模型参数量 */
    @Excel(name = "模型参数量")
    private String modelParams;

    /** 模型厂商 */
    @Excel(name = "模型厂商")
    private String modelVendor;

    /** 补充信息 */
    @Excel(name = "补充信息")
    private String additionalInfo;

    /** API 密钥 */
    @Excel(name = "API 密钥")
    private String apiKey;

    /** 任务创建时间 */
    @JsonFormat(pattern = "yyyy-MM-dd")
    @Excel(name = "任务创建时间", width = 30, dateFormat = "yyyy-MM-dd")
    private Date taskCreatedAt;

    /** 任务状态 */
    @Excel(name = "任务状态")
    private Long taskStatus;

    /** 任务报告 */
    private String taskReportPdf;

    public void setTaskId(Long taskId) 
    {
        this.taskId = taskId;
    }

    public Long getTaskId() 
    {
        return taskId;
    }
    public void setModelName(String modelName) 
    {
        this.modelName = modelName;
    }

    public String getModelName() 
    {
        return modelName;
    }
    public void setModelParams(String modelParams) 
    {
        this.modelParams = modelParams;
    }

    public String getModelParams() 
    {
        return modelParams;
    }
    public void setModelVendor(String modelVendor) 
    {
        this.modelVendor = modelVendor;
    }

    public String getModelVendor() 
    {
        return modelVendor;
    }
    public void setAdditionalInfo(String additionalInfo) 
    {
        this.additionalInfo = additionalInfo;
    }

    public String getAdditionalInfo() 
    {
        return additionalInfo;
    }
    public void setApiKey(String apiKey) 
    {
        this.apiKey = apiKey;
    }

    public String getApiKey() 
    {
        return apiKey;
    }
    public void setTaskCreatedAt(Date taskCreatedAt) 
    {
        this.taskCreatedAt = taskCreatedAt;
    }

    public Date getTaskCreatedAt() 
    {
        return taskCreatedAt;
    }
    public void setTaskStatus(Long taskStatus) 
    {
        this.taskStatus = taskStatus;
    }

    public Long getTaskStatus() 
    {
        return taskStatus;
    }
    public void setTaskReportPdf(String taskReportPdf) 
    {
        this.taskReportPdf = taskReportPdf;
    }

    public String getTaskReportPdf() 
    {
        return taskReportPdf;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("taskId", getTaskId())
            .append("modelName", getModelName())
            .append("modelParams", getModelParams())
            .append("modelVendor", getModelVendor())
            .append("additionalInfo", getAdditionalInfo())
            .append("apiKey", getApiKey())
            .append("taskCreatedAt", getTaskCreatedAt())
            .append("taskStatus", getTaskStatus())
            .append("taskReportPdf", getTaskReportPdf())
            .toString();
    }
}

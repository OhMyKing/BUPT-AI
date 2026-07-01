package com.ruoyi.admim_api.domain;

import java.math.BigDecimal;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 增强API管理对象 enhanceinfo
 * 
 * @author ruoyi
 * @date 2024-06-20
 */
public class adminEnhanceinfo extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** API编号 */
    private Long enhancementApiId;

    /** 增强模型名称 */
    @Excel(name = "增强模型名称")
    private String enhancementModelName;

    /** 模型参数量 */
    @Excel(name = "模型参数量")
    private String modelParams;

    /** 模型厂商 */
    @Excel(name = "模型厂商")
    private String modelVendor;

    /** 补充信息 */
    @Excel(name = "补充信息")
    private String additionalInfo;

    /** API状态 */
    @Excel(name = "API状态")
    private Long apiStatus;

    /** API额度 */
    @Excel(name = "API额度")
    private BigDecimal apiQuota;

    /** API密钥 */
    @Excel(name = "API密钥")
    private String apiKey;

    public void setEnhancementApiId(Long enhancementApiId) 
    {
        this.enhancementApiId = enhancementApiId;
    }

    public Long getEnhancementApiId() 
    {
        return enhancementApiId;
    }
    public void setEnhancementModelName(String enhancementModelName) 
    {
        this.enhancementModelName = enhancementModelName;
    }

    public String getEnhancementModelName() 
    {
        return enhancementModelName;
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
    public void setApiStatus(Long apiStatus) 
    {
        this.apiStatus = apiStatus;
    }

    public Long getApiStatus() 
    {
        return apiStatus;
    }
    public void setApiQuota(BigDecimal apiQuota) 
    {
        this.apiQuota = apiQuota;
    }

    public BigDecimal getApiQuota() 
    {
        return apiQuota;
    }
    public void setApiKey(String apiKey) 
    {
        this.apiKey = apiKey;
    }

    public String getApiKey() 
    {
        return apiKey;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("enhancementApiId", getEnhancementApiId())
            .append("enhancementModelName", getEnhancementModelName())
            .append("modelParams", getModelParams())
            .append("modelVendor", getModelVendor())
            .append("additionalInfo", getAdditionalInfo())
            .append("apiStatus", getApiStatus())
            .append("apiQuota", getApiQuota())
            .append("apiKey", getApiKey())
            .toString();
    }
}

package com.ruoyi.enhance.controller;

import java.util.List;
import javax.servlet.http.HttpServletResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.enhance.domain.Enhanceinfo;
import com.ruoyi.enhance.service.IEnhanceinfoService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 增强API管理Controller
 * 
 * @author ruoyi
 * @date 2024-06-20
 */
@RestController
@RequestMapping("/enhance/enhanceinfo")
public class EnhanceinfoController extends BaseController
{
    @Autowired
    private IEnhanceinfoService enhanceinfoService;

    /**
     * 查询增强API管理列表
     */
    @PreAuthorize("@ss.hasPermi('enhance:enhanceinfo:list')")
    @GetMapping("/list")
    public TableDataInfo list(Enhanceinfo enhanceinfo)
    {
        startPage();
        List<Enhanceinfo> list = enhanceinfoService.selectEnhanceinfoList(enhanceinfo);
        return getDataTable(list);
    }

    /**
     * 导出增强API管理列表
     */
    @PreAuthorize("@ss.hasPermi('enhance:enhanceinfo:export')")
    @Log(title = "增强API管理", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, Enhanceinfo enhanceinfo)
    {
        List<Enhanceinfo> list = enhanceinfoService.selectEnhanceinfoList(enhanceinfo);
        ExcelUtil<Enhanceinfo> util = new ExcelUtil<Enhanceinfo>(Enhanceinfo.class);
        util.exportExcel(response, list, "增强API管理数据");
    }

    /**
     * 获取增强API管理详细信息
     */
    @PreAuthorize("@ss.hasPermi('enhance:enhanceinfo:query')")
    @GetMapping(value = "/{enhancementApiId}")
    public AjaxResult getInfo(@PathVariable("enhancementApiId") Long enhancementApiId)
    {
        return success(enhanceinfoService.selectEnhanceinfoByEnhancementApiId(enhancementApiId));
    }

    /**
     * 新增增强API管理
     */
    @PreAuthorize("@ss.hasPermi('enhance:enhanceinfo:add')")
    @Log(title = "增强API管理", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody Enhanceinfo enhanceinfo)
    {
        return toAjax(enhanceinfoService.insertEnhanceinfo(enhanceinfo));
    }

    /**
     * 修改增强API管理
     */
    @PreAuthorize("@ss.hasPermi('enhance:enhanceinfo:edit')")
    @Log(title = "增强API管理", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody Enhanceinfo enhanceinfo)
    {
        return toAjax(enhanceinfoService.updateEnhanceinfo(enhanceinfo));
    }

    /**
     * 删除增强API管理
     */
    @PreAuthorize("@ss.hasPermi('enhance:enhanceinfo:remove')")
    @Log(title = "增强API管理", businessType = BusinessType.DELETE)
	@DeleteMapping("/{enhancementApiIds}")
    public AjaxResult remove(@PathVariable Long[] enhancementApiIds)
    {
        return toAjax(enhanceinfoService.deleteEnhanceinfoByEnhancementApiIds(enhancementApiIds));
    }
}

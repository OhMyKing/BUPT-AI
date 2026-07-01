package com.ruoyi.admim_api.controller;

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
import com.ruoyi.admim_api.domain.adminTaskinfo;
import com.ruoyi.admim_api.service.IadminTaskinfoService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 测试任务管理Controller
 * 
 * @author ruoyi
 * @date 2024-06-20
 */
@RestController
@RequestMapping("/admim_api/taskinfo")
public class adminTaskinfoController extends BaseController
{
    @Autowired
    private IadminTaskinfoService adminTaskinfoService;

    /**
     * 查询测试任务管理列表
     */
    @PreAuthorize("@ss.hasPermi('admim_api:taskinfo:list')")
    @GetMapping("/list")
    public TableDataInfo list(adminTaskinfo adminTaskinfo)
    {
        startPage();
        List<adminTaskinfo> list = adminTaskinfoService.selectadminTaskinfoList(adminTaskinfo);
        return getDataTable(list);
    }

    /**
     * 导出测试任务管理列表
     */
    @PreAuthorize("@ss.hasPermi('admim_api:taskinfo:export')")
    @Log(title = "测试任务管理", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, adminTaskinfo adminTaskinfo)
    {
        List<adminTaskinfo> list = adminTaskinfoService.selectadminTaskinfoList(adminTaskinfo);
        ExcelUtil<adminTaskinfo> util = new ExcelUtil<adminTaskinfo>(adminTaskinfo.class);
        util.exportExcel(response, list, "测试任务管理数据");
    }

    /**
     * 获取测试任务管理详细信息
     */
    @PreAuthorize("@ss.hasPermi('admim_api:taskinfo:query')")
    @GetMapping(value = "/{taskId}")
    public AjaxResult getInfo(@PathVariable("taskId") Long taskId)
    {
        return success(adminTaskinfoService.selectadminTaskinfoByTaskId(taskId));
    }

    /**
     * 新增测试任务管理
     */
    @PreAuthorize("@ss.hasPermi('admim_api:taskinfo:add')")
    @Log(title = "测试任务管理", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody adminTaskinfo adminTaskinfo)
    {
        return toAjax(adminTaskinfoService.insertadminTaskinfo(adminTaskinfo));
    }

    /**
     * 修改测试任务管理
     */
    @PreAuthorize("@ss.hasPermi('admim_api:taskinfo:edit')")
    @Log(title = "测试任务管理", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody adminTaskinfo adminTaskinfo)
    {
        return toAjax(adminTaskinfoService.updateadminTaskinfo(adminTaskinfo));
    }

    /**
     * 删除测试任务管理
     */
    @PreAuthorize("@ss.hasPermi('admim_api:taskinfo:remove')")
    @Log(title = "测试任务管理", businessType = BusinessType.DELETE)
	@DeleteMapping("/{taskIds}")
    public AjaxResult remove(@PathVariable Long[] taskIds)
    {
        return toAjax(adminTaskinfoService.deleteadminTaskinfoByTaskIds(taskIds));
    }
}

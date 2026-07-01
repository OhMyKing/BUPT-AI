package com.ruoyi.test.controller;

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
import com.ruoyi.test.domain.Taskinfo;
import com.ruoyi.test.service.ITaskinfoService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 大语言模型测试任务Controller
 * 
 * @author ruoyi
 * @date 2024-06-20
 */
@RestController
@RequestMapping("/test/taskinfo")
public class TaskinfoController extends BaseController
{
    @Autowired
    private ITaskinfoService taskinfoService;

    /**
     * 查询大语言模型测试任务列表
     */
    @PreAuthorize("@ss.hasPermi('test:taskinfo:list')")
    @GetMapping("/list")
    public TableDataInfo list(Taskinfo taskinfo)
    {
        startPage();
        List<Taskinfo> list = taskinfoService.selectTaskinfoList(taskinfo);
        return getDataTable(list);
    }

    /**
     * 导出大语言模型测试任务列表
     */
    @PreAuthorize("@ss.hasPermi('test:taskinfo:export')")
    @Log(title = "大语言模型测试任务", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, Taskinfo taskinfo)
    {
        List<Taskinfo> list = taskinfoService.selectTaskinfoList(taskinfo);
        ExcelUtil<Taskinfo> util = new ExcelUtil<Taskinfo>(Taskinfo.class);
        util.exportExcel(response, list, "大语言模型测试任务数据");
    }

    /**
     * 获取大语言模型测试任务详细信息
     */
    @PreAuthorize("@ss.hasPermi('test:taskinfo:query')")
    @GetMapping(value = "/{taskId}")
    public AjaxResult getInfo(@PathVariable("taskId") Long taskId)
    {
        return success(taskinfoService.selectTaskinfoByTaskId(taskId));
    }

    /**
     * 新增大语言模型测试任务
     */
    @PreAuthorize("@ss.hasPermi('test:taskinfo:add')")
    @Log(title = "大语言模型测试任务", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody Taskinfo taskinfo)
    {
        return toAjax(taskinfoService.insertTaskinfo(taskinfo));
    }

    /**
     * 修改大语言模型测试任务
     */
    @PreAuthorize("@ss.hasPermi('test:taskinfo:edit')")
    @Log(title = "大语言模型测试任务", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody Taskinfo taskinfo)
    {
        return toAjax(taskinfoService.updateTaskinfo(taskinfo));
    }

    /**
     * 删除大语言模型测试任务
     */
    @PreAuthorize("@ss.hasPermi('test:taskinfo:remove')")
    @Log(title = "大语言模型测试任务", businessType = BusinessType.DELETE)
	@DeleteMapping("/{taskIds}")
    public AjaxResult remove(@PathVariable Long[] taskIds)
    {
        return toAjax(taskinfoService.deleteTaskinfoByTaskIds(taskIds));
    }
}

package com.ruoyi.system.controller;

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
import com.ruoyi.system.domain.Robots;
import com.ruoyi.system.service.IRobotsService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 机器人管理Controller
 * 
 * @author ruoyi
 * @date 2025-05-23
 */
@RestController
@RequestMapping("/system/robots")
public class RobotsController extends BaseController
{
    @Autowired
    private IRobotsService robotsService;

    /**
     * 查询机器人管理列表
     */
    @PreAuthorize("@ss.hasPermi('system:robots:list')")
    @GetMapping("/list")
    public TableDataInfo list(Robots robots)
    {
        startPage();
        List<Robots> list = robotsService.selectRobotsList(robots);
        return getDataTable(list);
    }

    /**
     * 导出机器人管理列表
     */
    @PreAuthorize("@ss.hasPermi('system:robots:export')")
    @Log(title = "机器人管理", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, Robots robots)
    {
        List<Robots> list = robotsService.selectRobotsList(robots);
        ExcelUtil<Robots> util = new ExcelUtil<Robots>(Robots.class);
        util.exportExcel(response, list, "机器人管理数据");
    }

    /**
     * 获取机器人管理详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:robots:query')")
    @GetMapping(value = "/{robotId}")
    public AjaxResult getInfo(@PathVariable("robotId") String robotId)
    {
        return success(robotsService.selectRobotsByRobotId(robotId));
    }

    /**
     * 新增机器人管理
     */
    @PreAuthorize("@ss.hasPermi('system:robots:add')")
    @Log(title = "机器人管理", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody Robots robots)
    {
        return toAjax(robotsService.insertRobots(robots));
    }

    /**
     * 修改机器人管理
     */
    @PreAuthorize("@ss.hasPermi('system:robots:edit')")
    @Log(title = "机器人管理", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody Robots robots)
    {
        return toAjax(robotsService.updateRobots(robots));
    }

    /**
     * 删除机器人管理
     */
    @PreAuthorize("@ss.hasPermi('system:robots:remove')")
    @Log(title = "机器人管理", businessType = BusinessType.DELETE)
	@DeleteMapping("/{robotIds}")
    public AjaxResult remove(@PathVariable String[] robotIds)
    {
        return toAjax(robotsService.deleteRobotsByRobotIds(robotIds));
    }
}

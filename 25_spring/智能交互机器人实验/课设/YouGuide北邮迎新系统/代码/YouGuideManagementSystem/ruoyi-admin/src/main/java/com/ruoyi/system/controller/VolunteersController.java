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
import com.ruoyi.system.domain.Volunteers;
import com.ruoyi.system.service.IVolunteersService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 志愿者信息管理Controller
 * 
 * @author ruoyi
 * @date 2025-05-23
 */
@RestController
@RequestMapping("/system/volunteers")
public class VolunteersController extends BaseController
{
    @Autowired
    private IVolunteersService volunteersService;

    /**
     * 查询志愿者信息管理列表
     */
    @PreAuthorize("@ss.hasPermi('system:volunteers:list')")
    @GetMapping("/list")
    public TableDataInfo list(Volunteers volunteers)
    {
        startPage();
        List<Volunteers> list = volunteersService.selectVolunteersList(volunteers);
        return getDataTable(list);
    }

    /**
     * 导出志愿者信息管理列表
     */
    @PreAuthorize("@ss.hasPermi('system:volunteers:export')")
    @Log(title = "志愿者信息管理", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, Volunteers volunteers)
    {
        List<Volunteers> list = volunteersService.selectVolunteersList(volunteers);
        ExcelUtil<Volunteers> util = new ExcelUtil<Volunteers>(Volunteers.class);
        util.exportExcel(response, list, "志愿者信息管理数据");
    }

    /**
     * 获取志愿者信息管理详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:volunteers:query')")
    @GetMapping(value = "/{volunteerId}")
    public AjaxResult getInfo(@PathVariable("volunteerId") String volunteerId)
    {
        return success(volunteersService.selectVolunteersByVolunteerId(volunteerId));
    }

    /**
     * 新增志愿者信息管理
     */
    @PreAuthorize("@ss.hasPermi('system:volunteers:add')")
    @Log(title = "志愿者信息管理", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody Volunteers volunteers)
    {
        return toAjax(volunteersService.insertVolunteers(volunteers));
    }

    /**
     * 修改志愿者信息管理
     */
    @PreAuthorize("@ss.hasPermi('system:volunteers:edit')")
    @Log(title = "志愿者信息管理", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody Volunteers volunteers)
    {
        return toAjax(volunteersService.updateVolunteers(volunteers));
    }

    /**
     * 删除志愿者信息管理
     */
    @PreAuthorize("@ss.hasPermi('system:volunteers:remove')")
    @Log(title = "志愿者信息管理", businessType = BusinessType.DELETE)
	@DeleteMapping("/{volunteerIds}")
    public AjaxResult remove(@PathVariable String[] volunteerIds)
    {
        return toAjax(volunteersService.deleteVolunteersByVolunteerIds(volunteerIds));
    }
}

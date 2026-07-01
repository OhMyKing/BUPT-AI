package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.system.domain.Students;

/**
 * 新生管理Mapper接口
 * 
 * @author ruoyi
 * @date 2025-05-23
 */
public interface StudentsMapper 
{
    /**
     * 查询新生管理
     * 
     * @param studentId 新生管理主键
     * @return 新生管理
     */
    public Students selectStudentsByStudentId(Long studentId);

    /**
     * 查询新生管理列表
     * 
     * @param students 新生管理
     * @return 新生管理集合
     */
    public List<Students> selectStudentsList(Students students);

    /**
     * 新增新生管理
     * 
     * @param students 新生管理
     * @return 结果
     */
    public int insertStudents(Students students);

    /**
     * 修改新生管理
     * 
     * @param students 新生管理
     * @return 结果
     */
    public int updateStudents(Students students);

    /**
     * 删除新生管理
     * 
     * @param studentId 新生管理主键
     * @return 结果
     */
    public int deleteStudentsByStudentId(Long studentId);

    /**
     * 批量删除新生管理
     * 
     * @param studentIds 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteStudentsByStudentIds(Long[] studentIds);
}

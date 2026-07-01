package com.ruoyi.system.service.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.StudentsMapper;
import com.ruoyi.system.domain.Students;
import com.ruoyi.system.service.IStudentsService;

/**
 * 新生管理Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-05-23
 */
@Service
public class StudentsServiceImpl implements IStudentsService 
{
    @Autowired
    private StudentsMapper studentsMapper;

    /**
     * 查询新生管理
     * 
     * @param studentId 新生管理主键
     * @return 新生管理
     */
    @Override
    public Students selectStudentsByStudentId(Long studentId)
    {
        return studentsMapper.selectStudentsByStudentId(studentId);
    }

    /**
     * 查询新生管理列表
     * 
     * @param students 新生管理
     * @return 新生管理
     */
    @Override
    public List<Students> selectStudentsList(Students students)
    {
        return studentsMapper.selectStudentsList(students);
    }

    /**
     * 新增新生管理
     * 
     * @param students 新生管理
     * @return 结果
     */
    @Override
    public int insertStudents(Students students)
    {
        return studentsMapper.insertStudents(students);
    }

    /**
     * 修改新生管理
     * 
     * @param students 新生管理
     * @return 结果
     */
    @Override
    public int updateStudents(Students students)
    {
        return studentsMapper.updateStudents(students);
    }

    /**
     * 批量删除新生管理
     * 
     * @param studentIds 需要删除的新生管理主键
     * @return 结果
     */
    @Override
    public int deleteStudentsByStudentIds(Long[] studentIds)
    {
        return studentsMapper.deleteStudentsByStudentIds(studentIds);
    }

    /**
     * 删除新生管理信息
     * 
     * @param studentId 新生管理主键
     * @return 结果
     */
    @Override
    public int deleteStudentsByStudentId(Long studentId)
    {
        return studentsMapper.deleteStudentsByStudentId(studentId);
    }
}

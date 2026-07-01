import request from '@/utils/request'

// 查询新生管理列表
export function listStudents(query) {
  return request({
    url: '/system/students/list',
    method: 'get',
    params: query
  })
}

// 查询新生管理详细
export function getStudents(studentId) {
  return request({
    url: '/system/students/' + studentId,
    method: 'get'
  })
}

// 新增新生管理
export function addStudents(data) {
  return request({
    url: '/system/students',
    method: 'post',
    data: data
  })
}

// 修改新生管理
export function updateStudents(data) {
  return request({
    url: '/system/students',
    method: 'put',
    data: data
  })
}

// 删除新生管理
export function delStudents(studentId) {
  return request({
    url: '/system/students/' + studentId,
    method: 'delete'
  })
}

import request from '@/utils/request'

// 查询志愿者信息管理列表
export function listVolunteers(query) {
  return request({
    url: '/system/volunteers/list',
    method: 'get',
    params: query
  })
}

// 查询志愿者信息管理详细
export function getVolunteers(volunteerId) {
  return request({
    url: '/system/volunteers/' + volunteerId,
    method: 'get'
  })
}

// 新增志愿者信息管理
export function addVolunteers(data) {
  return request({
    url: '/system/volunteers',
    method: 'post',
    data: data
  })
}

// 修改志愿者信息管理
export function updateVolunteers(data) {
  return request({
    url: '/system/volunteers',
    method: 'put',
    data: data
  })
}

// 删除志愿者信息管理
export function delVolunteers(volunteerId) {
  return request({
    url: '/system/volunteers/' + volunteerId,
    method: 'delete'
  })
}

import request from '@/utils/request'

// 查询机器人管理列表
export function listRobots(query) {
  return request({
    url: '/system/robots/list',
    method: 'get',
    params: query
  })
}

// 查询机器人管理详细
export function getRobots(robotId) {
  return request({
    url: '/system/robots/' + robotId,
    method: 'get'
  })
}

// 新增机器人管理
export function addRobots(data) {
  return request({
    url: '/system/robots',
    method: 'post',
    data: data
  })
}

// 修改机器人管理
export function updateRobots(data) {
  return request({
    url: '/system/robots',
    method: 'put',
    data: data
  })
}

// 删除机器人管理
export function delRobots(robotId) {
  return request({
    url: '/system/robots/' + robotId,
    method: 'delete'
  })
}

import request from '@/utils/request'

// 查询测试任务管理列表
export function listTaskinfo(query) {
  return request({
    url: '/test/taskinfo/list',
    method: 'get',
    params: query
  })
}

// 查询测试任务管理详细
export function getTaskinfo(taskId) {
  return request({
    url: '/test/taskinfo/' + taskId,
    method: 'get'
  })
}

// 新增测试任务管理
export function addTaskinfo(data) {
  return request({
    url: '/test/taskinfo',
    method: 'post',
    data: data
  })
}

// 修改测试任务管理
export function updateTaskinfo(data) {
  return request({
    url: '/test/taskinfo',
    method: 'put',
    data: data
  })
}

// 删除测试任务管理
export function delTaskinfo(taskId) {
  return request({
    url: '/test/taskinfo/' + taskId,
    method: 'delete'
  })
}

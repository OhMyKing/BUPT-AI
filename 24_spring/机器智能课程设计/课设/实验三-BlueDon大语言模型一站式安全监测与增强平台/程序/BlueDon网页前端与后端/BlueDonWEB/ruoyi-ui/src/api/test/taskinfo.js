import request from '@/utils/request'

// 查询大语言模型测试任务列表
export function listTaskinfo(query) {
  return request({
    url: '/test/taskinfo/list',
    method: 'get',
    params: query
  })
}

// 查询大语言模型测试任务详细
export function getTaskinfo(taskId) {
  return request({
    url: '/test/taskinfo/' + taskId,
    method: 'get'
  })
}

// 新增大语言模型测试任务
export function addTaskinfo(data) {
  return request({
    url: '/test/taskinfo',
    method: 'post',
    data: data
  })
}

// 修改大语言模型测试任务
export function updateTaskinfo(data) {
  return request({
    url: '/test/taskinfo',
    method: 'put',
    data: data
  })
}

// 删除大语言模型测试任务
export function delTaskinfo(taskId) {
  return request({
    url: '/test/taskinfo/' + taskId,
    method: 'delete'
  })
}

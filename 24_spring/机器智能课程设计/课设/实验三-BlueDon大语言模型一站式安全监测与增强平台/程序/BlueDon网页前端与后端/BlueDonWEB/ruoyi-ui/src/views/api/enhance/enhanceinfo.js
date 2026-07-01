import request from '@/utils/request'

// 查询增强任务管理列表
export function listEnhanceinfo(query) {
  return request({
    url: '/enhance/enhanceinfo/list',
    method: 'get',
    params: query
  })
}

// 查询增强任务管理详细
export function getEnhanceinfo(enhancementApiId) {
  return request({
    url: '/enhance/enhanceinfo/' + enhancementApiId,
    method: 'get'
  })
}

// 新增增强任务管理
export function addEnhanceinfo(data) {
  return request({
    url: '/enhance/enhanceinfo',
    method: 'post',
    data: data
  })
}

// 修改增强任务管理
export function updateEnhanceinfo(data) {
  return request({
    url: '/enhance/enhanceinfo',
    method: 'put',
    data: data
  })
}

// 删除增强任务管理
export function delEnhanceinfo(enhancementApiId) {
  return request({
    url: '/enhance/enhanceinfo/' + enhancementApiId,
    method: 'delete'
  })
}

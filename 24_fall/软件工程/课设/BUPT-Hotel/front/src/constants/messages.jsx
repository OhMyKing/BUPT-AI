// constants/messages.jsx
export const ERROR_MESSAGES = {
    VALIDATION_ERROR: '请输入用户名和密码',
    AUTH_ERROR: '用户名或密码错误',
    FORBIDDEN: '账号已被禁用，请联系管理员',
    RATE_LIMIT: '登录尝试次数过多，请稍后再试',
    SERVER_ERROR: '服务器错误，请稍后重试',
    NETWORK_ERROR: '网络连接错误，请检查网络设置或联系管理员',
    SYSTEM_ERROR: '系统错误，请稍后重试',
    UNKNOWN_ERROR: '登录失败，请稍后重试',

    // 空调控制相关的错误消息
    INVALID_ROOM_ID: '无效的房间号',
    INVALID_TEMPERATURE: '温度设置无效，请设置16-30度之间的温度',
    INVALID_WIND_SPEED: '无效的风速设置',
    INVALID_SWEEP_MODE: '无效的扫风设置',
    ROOM_NOT_FOUND: '未找到指定房间',
    AIRCON_CONTROL_ERROR: '空调控制失败，请重试',
    AIRCON_STATUS_ERROR: '获取空调状态失败'
};
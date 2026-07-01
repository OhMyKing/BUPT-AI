import {
    saveAuthToken,
    saveFrontDeskToken,
    saveACManagerToken,
    saveManagerToken,
    getAuthToken,
    getFrontDeskToken,
    getACManagerToken,
    getManagerToken
} from '@utils/AuthUtils';

const API_BASE_URL = 'http://127.0.0.1:5004';

// 初始化系统账户
const SYSTEM_ACCOUNTS = {
    FRONT_DESK: { username: 'front_desk', password: 'front_desk' },
    AC_MANAGER: { username: 'ac_manager', password: 'ac_manager' },
    MANAGER: { username: 'manager', password: 'manager' }
};

// 自动登录并获取所有token
export const initializeSystemTokens = async () => {
    try {
        // 前台登录
        const frontDeskResponse = await loginWithCredentials(
            SYSTEM_ACCOUNTS.FRONT_DESK.username,
            SYSTEM_ACCOUNTS.FRONT_DESK.password
        );
        if (frontDeskResponse.token) {
            saveFrontDeskToken(frontDeskResponse.token);
        }

        // 空调管理员登录
        const acManagerResponse = await loginWithCredentials(
            SYSTEM_ACCOUNTS.AC_MANAGER.username,
            SYSTEM_ACCOUNTS.AC_MANAGER.password
        );
        if (acManagerResponse.token) {
            saveACManagerToken(acManagerResponse.token);
        }

        // 经理登录
        const managerResponse = await loginWithCredentials(
            SYSTEM_ACCOUNTS.MANAGER.username,
            SYSTEM_ACCOUNTS.MANAGER.password
        );
        if (managerResponse.token) {
            saveManagerToken(managerResponse.token);
        }

        return true;
    } catch (error) {
        console.error('初始化系统token失败:', error);
        return false;
    }
};

// 基础登录方法
const loginWithCredentials = async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (!response.ok || data.code !== 0) {
        throw new ApiError(data.message || '登录失败', 'AUTH_ERROR');
    }

    return data;
};

// 修改登录方法
export const loginAdmin = async (username, password) => {
    try {
        const data = await loginWithCredentials(username, password);
        if (data.code === 0) {
            saveAuthToken(data.token); // 保存为主token
            return data;
        }
        throw new ApiError(data.message || '登录失败', 'API_ERROR');
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError('系统错误，请稍后重试', 'SYSTEM_ERROR');
    }
};

// 修改获取适当的token的逻辑
const getAppropriateToken = (endpoint) => {
    // 对于空调接口使用空调管理员token
    if (endpoint.includes('/aircon/')) {
        return getACManagerToken() || getAuthToken();
    }
    // 其他所有接口（包括/stage/）都使用主token
    return getAuthToken();
};

// 修改通用请求配置
const getHeaders = (endpoint) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAppropriateToken(endpoint)}`
});

export class ApiError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}

// 获取空调状态
export const getAirConditionerStatus = async (roomId) => {
    try {
        if (!roomId) {
            throw new ApiError('房间号不能为空', 'VALIDATION_ERROR');
        }

        const response = await fetch(`${API_BASE_URL}/aircon/panel?roomId=${roomId}`, {
            method: 'GET',
            headers: getHeaders('/aircon/panel')
        });

        const data = await response.json();

        if (!response.ok) {
            switch (response.status) {
                case 401:
                    throw new ApiError('未授权访问', 'AUTH_ERROR');
                case 500:
                    throw new ApiError('服务器错误，请稍后重试', 'SERVER_ERROR');
                default:
                    throw new ApiError('获取状态失败，请稍后重试', 'UNKNOWN_ERROR');
            }
        }

        if (data.code !== 0) {
            throw new ApiError(data.message || '获取状态失败', 'API_ERROR');
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            throw new ApiError('网络连接错误，请检查网络设置', 'NETWORK_ERROR');
        }
        throw new ApiError('系统错误，请稍后重试', 'SYSTEM_ERROR');
    }
};

// 控制空调
export const controlAirConditioner = async (params) => {
    try {
        if (!params.roomId) {
            throw new ApiError('房间号不能为空', 'VALIDATION_ERROR');
        }

        // 修改这里，确保不改变原始参数
        const apiParams = {
            ...params,
            roomId: parseInt(params.roomId, 10),
            // 确保 sweep 值不被修改
            sweep: params.sweep
        };

        console.log('API 层实际发送的数据:', apiParams);

        const response = await fetch(`${API_BASE_URL}/aircon/control`, {
            method: 'POST',
            headers: getHeaders('/aircon/control'),
            body: JSON.stringify(apiParams)
        });

        console.log('发送的实际请求体:', await response.clone().json());

        const data = await response.json();

        if (!response.ok) {
            switch (response.status) {
                case 401:
                    throw new ApiError('未授权访问', 'AUTH_ERROR');
                case 400:
                    throw new ApiError('请求参数错误', 'VALIDATION_ERROR');
                case 500:
                    throw new ApiError('服务器错误，请稍后重试', 'SERVER_ERROR');
                default:
                    throw new ApiError('控制空调失败，请稍后重试', 'UNKNOWN_ERROR');
            }
        }

        if (data.code !== 0) {
            throw new ApiError(data.message || '控制空调失败', 'API_ERROR');
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            throw new ApiError('网络连接错误，请检查网络设置', 'NETWORK_ERROR');
        }
        throw new ApiError('系统错误，请稍后重试', 'SYSTEM_ERROR');
    }
};

// 修改获取房间详单
export const getRoomReport = async (roomId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/stage/record?roomId=${roomId}`, {
            method: 'GET',
            headers: getHeaders('/stage/record')
        });

        const data = await response.json();
        if (!response.ok || data.code !== 0) {
            throw new ApiError(data.message || '获取详单失败', 'API_ERROR');
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError('系统错误，请稍后重试', 'SYSTEM_ERROR');
    }
};

// 获取酒店房间总览
export const getHotelRoomsOverview = async () => {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new ApiError('未登录或登录已过期', 'AUTH_ERROR');
        }

        const response = await fetch(`${API_BASE_URL}/stage/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({})
        });

        const data = await response.json();

        if (!response.ok) {
            switch (response.status) {
                case 401:
                    throw new ApiError('未授权访问', 'AUTH_ERROR');
                case 500:
                    throw new ApiError('服务器错误，请稍后重试', 'SERVER_ERROR');
                default:
                    throw new ApiError('获取房间信息失败，请稍后重试', 'UNKNOWN_ERROR');
            }
        }

        if (data.code !== 0) {
            throw new ApiError(data.message || '获取房间信息失败', 'API_ERROR');
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            throw new ApiError('网络连接错误，请检查网络设置', 'NETWORK_ERROR');
        }
        throw new ApiError('系统错误，请稍后重试', 'SYSTEM_ERROR');
    }
};

// 修改办理入住
export const checkIn = async (roomId, peopleName) => {
    try {
        const response = await fetch(`${API_BASE_URL}/stage/add`, {
            method: 'POST',
            headers: getHeaders('/stage/add'),
            body: JSON.stringify({
                roomId: parseInt(roomId),
                peopleName
            })
        });

        const data = await response.json();
        if (!response.ok || data.code !== 0) {
            throw new ApiError(data.message || '入住失败', 'API_ERROR');
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError('系统错误，请稍后重试', 'SYSTEM_ERROR');
    }
};

// 修改办理退房
export const checkOut = async (roomId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/stage/delete?roomId=${roomId}`, {
            method: 'GET',
            headers: getHeaders('/stage/delete')
        });

        const data = await response.json();
        if (!response.ok || data.code !== 0) {
            throw new ApiError(data.message || '退房失败', 'API_ERROR');
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError('系统错误，请稍后重试', 'SYSTEM_ERROR');
    }
};

// 取近一周客流记录
export const getWeeklyGuestFlow = async () => {
    try {
        // 确保系统token已初始化
        await initializeSystemTokens();
        
        // 获取manager token
        const managerToken = getManagerToken();
        if (!managerToken) {
            throw new ApiError('无法获取管理员权限', 'AUTH_ERROR');
        }

        const response = await fetch(`${API_BASE_URL}/admin/query_people`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${managerToken}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                // 如果是认证错误，重新初始化token并提示用户刷新
                await initializeSystemTokens();
                throw new ApiError('认证失败，请刷新页面重试', 'AUTH_ERROR');
            }
            throw new ApiError(data.message || '获取客流记录失败', 'API_ERROR');
        }

        if (data.code !== 0) {
            throw new ApiError(data.message || '获取客流记录失败', 'API_ERROR');
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError('系统错误，请稍后重试', 'SYSTEM_ERROR');
    }
};

// 调整中央空调设置
export const adjustCentralAC = async (settings) => {
    try {
        const response = await fetch(`${API_BASE_URL}/central-aircon/adjust`, {
            method: 'POST',
            headers: getHeaders('/central-aircon/adjust'),
            body: JSON.stringify(settings)
        });

        const data = await response.json();

        if (!response.ok) {
            switch (response.status) {
                case 401:
                    throw new ApiError('未授权访问', 'AUTH_ERROR');
                case 400:
                    throw new ApiError('请求参数错误', 'VALIDATION_ERROR');
                default:
                    throw new ApiError('设置失败，请稍后重试', 'UNKNOWN_ERROR');
            }
        }

        if (data.code !== 0) {
            throw new ApiError(data.message || '设置失败', 'API_ERROR');
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError('系统错误，请稍后重试', 'SYSTEM_ERROR');
    }
};

// 获取所有房间空调状态
export const getAllRoomsACStatus = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/aircon/status`, {
            method: 'GET',
            headers: getHeaders('/aircon/status')
        });

        const data = await response.json();

        if (!response.ok) {
            switch (response.status) {
                case 401:
                    throw new ApiError('未授权访问', 'AUTH_ERROR');
                case 500:
                    throw new ApiError('服务器错误，请稍后重试', 'SERVER_ERROR');
                default:
                    throw new ApiError('获取状态失败，请稍后重试', 'UNKNOWN_ERROR');
            }
        }

        if (data.code !== 0) {
            throw new ApiError(data.message || '获取状态失败', 'API_ERROR');
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError('系统错误，请稍后重试', 'SYSTEM_ERROR');
    }
};

// 获取空调操作记录
export const getACOperationRecords = async () => {
    try {
        // 确保系统token已初始化
        await initializeSystemTokens();
        
        // 获取manager token
        const managerToken = getManagerToken();
        if (!managerToken) {
            throw new ApiError('无法获取管理员权限', 'AUTH_ERROR');
        }

        const response = await fetch(`${API_BASE_URL}/admin/query_ac`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${managerToken}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                // 如果是认证错误，重新初始化token并提示用户刷新
                await initializeSystemTokens();
                throw new ApiError('认证失败，请刷新页面重试', 'AUTH_ERROR');
            }
            throw new ApiError(data.message || '获取空调操作记录失败', 'API_ERROR');
        }

        if (data.code !== 0) {
            throw new ApiError(data.message || '获取空调操作记录失败', 'API_ERROR');
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError('系统错误，请稍后重试', 'SYSTEM_ERROR');
    }
};

// 获取空调调度记录
export const getScheduleRecords = async () => {
    try {
        // 确保系统token已初始化
        await initializeSystemTokens();
        
        // 获取manager token
        const managerToken = getManagerToken();
        if (!managerToken) {
            throw new ApiError('无法获取管理员权限', 'AUTH_ERROR');
        }

        const response = await fetch(`${API_BASE_URL}/admin/query_schedule`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${managerToken}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                await initializeSystemTokens();
                throw new ApiError('认证失败，请刷新页面重试', 'AUTH_ERROR');
            }
            throw new ApiError(data.message || '获取调度记录失败', 'API_ERROR');
        }

        if (data.code !== 0) {
            throw new ApiError(data.message || '获取调度记录失败', 'API_ERROR');
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError('系统错误，请稍后重试', 'SYSTEM_ERROR');
    }
};
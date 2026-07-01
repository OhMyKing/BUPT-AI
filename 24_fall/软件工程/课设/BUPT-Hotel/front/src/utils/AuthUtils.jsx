// utils/AuthUtils.jsx

// 存储键常量
export const AUTH_TOKEN_KEY = 'auth_token';
export const USER_ROLE_KEY = 'user_role';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const FRONT_DESK_TOKEN_KEY = 'front_desk_token';
export const AC_MANAGER_TOKEN_KEY = 'ac_manager_token';
export const MANAGER_TOKEN_KEY = 'manager_token';

// 认证状态存储
export const saveAuthToken = (token) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const saveUserRole = (role) => {
    localStorage.setItem(USER_ROLE_KEY, role);
};

export const saveRefreshToken = (token) => {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const saveFrontDeskToken = (token) => {
    localStorage.setItem(FRONT_DESK_TOKEN_KEY, token);
};

export const saveACManagerToken = (token) => {
    localStorage.setItem(AC_MANAGER_TOKEN_KEY, token);
};

export const saveManagerToken = (token) => {
    localStorage.setItem(MANAGER_TOKEN_KEY, token);
};

// 认证状态获取
export const getAuthToken = () => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const getUserRole = () => {
    return localStorage.getItem(USER_ROLE_KEY);
};

export const getRefreshToken = () => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const getFrontDeskToken = () => {
    return localStorage.getItem(FRONT_DESK_TOKEN_KEY);
};

export const getACManagerToken = () => {
    return localStorage.getItem(AC_MANAGER_TOKEN_KEY);
};

export const getManagerToken = () => {
    return localStorage.getItem(MANAGER_TOKEN_KEY);
};

// 清除认证状态
export const clearAuth = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(FRONT_DESK_TOKEN_KEY);
    localStorage.removeItem(AC_MANAGER_TOKEN_KEY);
    localStorage.removeItem(MANAGER_TOKEN_KEY);
};

// 权限检查
export const isAdmin = () => {
    return getUserRole() === 'admin';
};

export const isAuthorized = () => {
    return !!getAuthToken();
};

// Token 过期检查
export const isTokenExpired = (token) => {
    if (!token) return true;
    try {
        const [, payload] = token.split('.');
        const decoded = JSON.parse(atob(payload));
        return decoded.exp * 1000 < Date.now();
    } catch {
        return true;
    }
};

// 授权请求头获取
export const getAuthHeaders = () => {
    const token = getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};
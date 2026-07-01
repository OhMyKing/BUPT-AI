import React, { useState } from 'react';
import { User, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '@layout/GlassCard.jsx';
import hotelAdminImage from "@assets/login_admin.png";
import {ApiError, loginAdmin} from '@services/API';
import { saveAuthToken, saveUserRole } from '@utils/AuthUtils';
import { ToastContainer } from '@components/ui/toast';
import {ERROR_MESSAGES} from "@/constants/messages.jsx";

const AdminLoginPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loginAttempts, setLoginAttempts] = useState(0);

    const handleLogin = async (e) => {
        e.preventDefault();

        // 基本验证
        if (!username.trim() || !password.trim()) {
            ToastContainer.addToast(ERROR_MESSAGES.VALIDATION_ERROR, 'error');
            return;
        }

        setIsLoading(true);

        try {
            const response = await loginAdmin(username, password);

            if (response.code === 0) {
                // token已在loginAdmin中保存到localStorage
                const roleRoutes = {
                    '前台服务': '/receptionist/overview',
                    '空调管理': '/ac-admin/overview',
                    '酒店经理': '/manager/overview'
                };

                const redirectPath = roleRoutes[response.role];
                if (redirectPath) {
                    navigate(redirectPath);
                } else {
                    throw new Error('未知的用户角色');
                }
            }
        } catch (error) {
            ToastContainer.addToast(error.message || '登录失败', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const backgroundStyle = {
        background: 'linear-gradient(to bottom right, #dbeafe, #93c5fd, #eff6ff)',
    };

    return (
        <div className="flex items-center justify-center w-screen h-screen bg-gray-100">
            <div
                className="w-[90%] h-[90%] p-8 rounded-3xl shadow-2xl relative overflow-hidden transition-all duration-500"
                style={backgroundStyle}>
                <div className="absolute inset-0 backdrop-blur-md bg-black bg-opacity-10"></div>

                <div className="relative z-10 flex w-full h-full p-8">
                    <img
                        src={hotelAdminImage}
                        alt="Luxurious Hotel Room"
                        className="lg:w-1/2 w-full h-full object-cover rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300"
                    />
                    <div className="hidden lg:flex lg:w-1/8 h-full items-center justify-center p-8">
                    </div>

                    <GlassCard className="w-full lg:w-3/8 p-8 rounded-2xl bg-white bg-opacity-20 backdrop-blur-lg">
                        <div className="flex flex-col h-full justify-between">
                            <div className="flex items-center space-x-4 mb-8">
                                <div className="w-16 h-16 rounded-full bg-gray-800 bg-opacity-10 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-light text-gray-800">BUPT | 波普特酒店</h2>
                                    <p className="text-gray-600 text-sm">始于顾客需求，终于顾客满意</p>
                                </div>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-6 mb-8">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="员工ID"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full py-3 px-4 bg-transparent border-b border-gray-300 focus:border-gray-600 transition-colors duration-300 outline-none text-gray-800 placeholder-gray-500"
                                        disabled={isLoading}
                                    />
                                    <User className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18}/>
                                </div>
                                <div className="relative">
                                    <input
                                        type="password"
                                        placeholder="密码"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full py-3 px-4 bg-transparent border-b border-gray-300 focus:border-gray-600 transition-colors duration-300 outline-none text-gray-800 placeholder-gray-500"
                                        disabled={isLoading}
                                    />
                                    <Lock className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18}/>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-gray-800 text-white rounded-full flex items-center justify-center transition duration-300 ease-in-out hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isLoading}
                                >
                                    {isLoading ? '登录中...' : '进入'}
                                    {!isLoading && <ArrowRight className="ml-2" size={18}/>}
                                </button>
                            </form>

                            <div className="text-center text-gray-600 text-xs">
                                {/* 可以添加额外信息，如版权声明等 */}
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default AdminLoginPage;
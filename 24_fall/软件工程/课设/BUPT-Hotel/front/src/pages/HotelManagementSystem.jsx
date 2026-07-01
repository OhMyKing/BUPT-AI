import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Bed, Home, Users } from 'lucide-react';
import GlassCard from '@layout/GlassCard';
import MenuItem from '@ui/menu_item';
import RoomManagement from '@components/hotel_management/RoomManagement';
import Overview from '@components/hotel_management/Overview';
import HotelManagement from '@/components/hotel_management/HotelManagement';
import ACManagement from "@components/hotel_management/ACManagement";
import { RoomProvider } from '@contexts/RoomContext';

// 定义不同角色的路由前缀
const ROLE_ROUTES = {
    RECEPTIONIST: '/receptionist',
    AC_ADMIN: '/ac-admin',
    MANAGER: '/manager'
};

// 定义不同角色可以访问的菜单项
const ROLE_MENUS = {
    RECEPTIONIST: [
        { icon: Home, text: '前台概览', path: '/overview' },
        { icon: Bed, text: '房间管理', path: '/room' },
    ],
    AC_ADMIN: [
        { icon: Home, text: '空调概览', path: '/overview' },
        { icon: Bed, text: '空调管理', path: '/ac' },
    ],
    MANAGER: [
        { icon: Home, text: '酒店概览', path: '/overview' },
        { icon: Users, text: '酒店管理', path: '/hotel' },
    ]
};

// 定义不同角色的系统标题
const ROLE_TITLES = {
    RECEPTIONIST: '前台管理',
    AC_ADMIN: '空调管理',
    MANAGER: '综合管理'
};

const HotelManagementSystem = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const getCurrentRole = () => {
        const path = location.pathname.toLowerCase();
        if (path.startsWith(ROLE_ROUTES.RECEPTIONIST)) return 'RECEPTIONIST';
        if (path.startsWith(ROLE_ROUTES.AC_ADMIN)) return 'AC_ADMIN';
        if (path.startsWith(ROLE_ROUTES.MANAGER)) return 'MANAGER';
        return null;
    };

    const currentRole = getCurrentRole();

    if (!currentRole) {
        return <Navigate to={`${ROLE_ROUTES.RECEPTIONIST}/overview`} />;
    }

    const menuItems = ROLE_MENUS[currentRole];
    const systemTitle = ROLE_TITLES[currentRole];

    const backgroundStyle = {
        background: 'linear-gradient(to bottom right, #bfdbfe, #60a5fa, #dbeafe)',
    };

    const handleMenuClick = (path) => {
        navigate(`${ROLE_ROUTES[currentRole]}${path}`);
    };

    const isMenuItemActive = (itemPath) => {
        const currentPath = location.pathname.toLowerCase();
        const fullItemPath = `${ROLE_ROUTES[currentRole]}${itemPath}`.toLowerCase();
        return currentPath === fullItemPath;
    };

    return (
        <RoomProvider>
            <div className="flex items-center justify-center w-screen h-screen bg-gray-100">
                <div
                    className="w-[90%] h-[90%] p-8 rounded-3xl shadow-2xl relative overflow-hidden transition-all duration-500"
                    style={backgroundStyle}>
                    <div className="absolute inset-0 backdrop-blur-md bg-black bg-opacity-10"></div>
                    <div className="relative z-10 flex h-full space-x-6">
                        <GlassCard className="w-1/4 flex flex-col space-y-4">
                            <h2 className="text-3xl font-bold mb-4">{systemTitle}</h2>
                            {menuItems.map((item) => (
                                <MenuItem
                                    key={item.text}
                                    icon={item.icon}
                                    text={item.text}
                                    active={isMenuItemActive(item.path)}
                                    onClick={() => handleMenuClick(item.path)}
                                />
                            ))}
                        </GlassCard>

                        <div className="relative z-10 flex w-full h-full gap-6">
                            <GlassCard className="flex-1 h-full">
                                <Routes>
                                    <Route path="/overview" element={<Overview role={currentRole} />} />
                                    <Route path="/room" element={<RoomManagement role={currentRole} />} />
                                    <Route path="/ac" element={<ACManagement />} />
                                    <Route path="/hotel" element={<HotelManagement />} />
                                    <Route path="*" element={<Navigate to="overview" replace />} />
                                </Routes>
                            </GlassCard>
                        </div>
                    </div>
                </div>
            </div>
        </RoomProvider>
    );
};

export default HotelManagementSystem;
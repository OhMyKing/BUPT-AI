import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Home, Search, User, Calendar, BarChart2, CircleHelp, MessageCircleMore} from 'lucide-react';
import HomePage from './home';
import { DivinationPage } from './DivinationPage';
import ChatPage from './ChatPage';
import ProfilePage from './ProfilePage';
import ProfileSettings from './ProfileSettings';
import CalendarPage from './CalendarPage';
import FortuneAnalysisPage from './FortuneAnalysisPage';
import PrivacyPolicyPage from './PrivacyPolicyPage';
import TermsOfServicePage from './TermsOfServicePage';
import AboutPage from './AboutPage';
import FeedbackPage from './FeedbackPage';
import bagua from '../img/bagua.png';

// 类型定义
interface UserInfo {
  name: string;
  gender: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthHour: string;
  [key: string]: any;
}

interface BottomNavigationProps {
  currentPage: string;
  setCurrentPage: Dispatch<SetStateAction<string>>;
}

interface UserRegistrationModalProps {
  onSubmit: (info: UserInfo) => void;
}

// 添加自定义字体 - 放在组件外部
const GlobalStyles = () => (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@400;500;600;700&display=swap');
    
    body {
      font-family: 'Noto Serif SC', serif;
      background-color: #f9f7f0;
      color: #333;
    }
    
    h1, h2, h3, .title-font {
      font-family: 'Ma Shan Zheng', cursive;
    }
    
    /* 传统纸质感 */
    .paper-card {
      background-color: #fff;
      border: 1px solid #e8e0d0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    /* 卦象线条样式 */
    .yang-line {
      height: 3px;
      background: #333;
    }
    
    .yin-line-part {
      height: 3px;
      background: #333;
    }
    
    /* 导航样式 */
    .nav-bar {
      background-color: #c06b5a;
      color: white;
    }
    
    /* 主题色按钮 */
    .primary-btn {
      background-color: #c06b5a;
      color: white;
    }
    
    /* 次要按钮 */
    .secondary-btn {
      background-color: #c69063;
      color: white;
    }
    
    /* 为聊天页面添加禁止滚动样式 */
    .no-scroll {
      overflow: hidden;
      position: fixed;
      width: 100%;
      height: 100%;
    }
  `}</style>
);

// Main App Component
const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showModal, setShowModal] = useState(false);
  // 新增：添加初始问题状态
  const [initialChatQuestion, setInitialChatQuestion] = useState<string | undefined>(undefined);
  
  // Check if user has registered
  useEffect(() => {
    const savedUserInfo = localStorage.getItem('userInfo');
    if (savedUserInfo) {
      setUserInfo(JSON.parse(savedUserInfo));
    } else {
      setShowModal(true);
    }
  }, []);

  // 新增：当页面切换时，清除初始问题
  // 这样可以防止用户在离开聊天页后再次进入时，仍然显示上次的问题
  useEffect(() => {
    // 当页面从'chat'切换到其他页面时，清除initialChatQuestion
    if (currentPage !== 'chat') {
      setInitialChatQuestion(undefined);
    }
  }, [currentPage]);

  // Save user info
  const handleUserInfoSubmit = (info: UserInfo) => {
    setUserInfo(info);
    localStorage.setItem('userInfo', JSON.stringify(info));
    setShowModal(false);
  };

  // 显示底部导航栏的页面
  const showBottomNav = ['home', 'divination', 'profile', 'chat', 'calendar', 'fortune'].includes(currentPage);

  // 判断是否显示顶部导航栏
  const showTopNav = !['profileSettings', 'privacyPolicy', 'termsOfService', 'about', 'feedback'].includes(currentPage);

  // Render different pages based on currentPage state
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage setCurrentPage={setCurrentPage} userInfo={userInfo} />;
      case 'divination':
        return <DivinationPage 
                 setCurrentPage={setCurrentPage} 
                 userInfo={userInfo} 
                 setInitialChatQuestion={setInitialChatQuestion} // 传递设置问题的函数
               />;
      case 'profile':
        return <ProfilePage setCurrentPage={setCurrentPage} userInfo={userInfo} />;
      case 'profileSettings':
        return <ProfileSettings setCurrentPage={setCurrentPage} userInfo={userInfo} setUserInfo={setUserInfo} />;
      case 'chat':
        return <ChatPage 
                 setCurrentPage={setCurrentPage} 
                 userInfo={userInfo} 
                 initialQuestion={initialChatQuestion} // 传递初始问题
               />;
      case 'calendar':
        return <CalendarPage setCurrentPage={setCurrentPage} />;
      case 'fortune':
        return <FortuneAnalysisPage setCurrentPage={setCurrentPage} userInfo={userInfo} />;
      case 'privacyPolicy':
        return <PrivacyPolicyPage setCurrentPage={setCurrentPage} />;
      case 'termsOfService':
        return <TermsOfServicePage setCurrentPage={setCurrentPage} />;  
      case 'about':
        return <AboutPage setCurrentPage={setCurrentPage} />;
      case 'feedback':
        return <FeedbackPage setCurrentPage={setCurrentPage} userInfo={userInfo} />;
      default:
        return <HomePage setCurrentPage={setCurrentPage} userInfo={userInfo} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <GlobalStyles />
      
      {/* 顶部标题栏 - 只在特定页面显示 */}
      {showTopNav && (
        <header className="fixed top-0 left-0 right-0 bg-white p-3 flex items-center justify-between border-b border-gray-200 shadow-sm z-10">
          <div className="flex items-center">
            <img src={bagua} alt="易卦" className="h-8 w-8" />
            <h1 className="text-xl title-font text-gray-800 ml-2">易卦</h1>
          </div>
        </header>
      )}
      
      {showModal && <UserRegistrationModal onSubmit={handleUserInfoSubmit} />}
      
      <main className={`flex-grow ${showBottomNav ? 'pb-16' : ''} ${showTopNav ? 'pt-14' : ''}`}>
        {renderPage()}
      </main>
            
      {/* 只在主要导航页面显示底部导航栏 */}
      {showBottomNav && <BottomNavigation currentPage={currentPage} setCurrentPage={setCurrentPage} />}
    </div>
  );
};

// User Registration Modal
// User Registration Modal - 改进版
const UserRegistrationModal = ({ onSubmit }: UserRegistrationModalProps) => {
  const [formData, setFormData] = useState<UserInfo>({
    name: '',
    gender: '男',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    birthHour: ''
  });
  
  // 添加错误状态管理
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 当字段被修改时清除该字段的错误信息
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 表单验证函数
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    // 验证姓名
    if (!formData.name.trim()) {
      newErrors.name = "请输入您的姓名";
    }
    
    // 验证出生年份
    if (!formData.birthYear) {
      newErrors.birthYear = "请选择出生年份";
    }
    
    // 验证出生月份
    if (!formData.birthMonth) {
      newErrors.birthMonth = "请选择出生月份";
    }
    
    // 验证出生日期
    if (!formData.birthDay) {
      newErrors.birthDay = "请选择出生日期";
    }
    
    // 验证出生时辰
    if (!formData.birthHour) {
      newErrors.birthHour = "请选择出生时辰";
    }
    
    // 更新错误状态
    setErrors(newErrors);
    
    // 如果没有错误，返回 true
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setSubmitting(true);
    
    // 验证表单
    if (!validateForm()) {
      setSubmitting(false);
      return;
    }
    
    // 所有验证通过，提交表单
    onSubmit(formData);
    setSubmitting(false);
  };

  // 生成选项数组的函数与原来相同
  const yearOptions = Array.from({ length: 100 }, (_, i) => 2025 - i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);
  const hourOptions = ["未知","子时(23-1点)", "丑时(1-3点)", "寅时(3-5点)", "卯时(5-7点)", 
                      "辰时(7-9点)", "巳时(9-11点)", "午时(11-13点)", "未时(13-15点)", 
                      "申时(15-17点)", "酉时(17-19点)", "戌时(19-21点)", "亥时(21-23点)"];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="paper-card rounded-lg p-4 w-11/12 max-w-md max-h-[90vh] overflow-y-auto">
      <div className="flex justify-center mb-2">
        <img src={bagua} alt="易卦" className="h-6 w-6" />
      </div>
      <h2 className="text-lg title-font text-center mb-2 text-gray-800">首次使用填写信息</h2>
      <p className="text-center text-gray-600 mb-3 text-sm">请填写您的个人信息，以获取更准确的命理分析</p>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label className="block text-gray-700 text-sm mb-1">姓名 <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-2 py-1 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded bg-white text-gray-800 focus:outline-none focus:border-gray-500`}
            required
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        
        <div className="mb-2">
          <label className="block text-gray-700 text-sm mb-1">性别 <span className="text-red-500">*</span></label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-gray-800 focus:outline-none focus:border-gray-500"
            required
          >
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="mb-2">
            <label className="block text-gray-700 text-sm mb-1">出生年 <span className="text-red-500">*</span></label>
            <select
              name="birthYear"
              value={formData.birthYear}
              onChange={handleChange}
              className={`w-full px-2 py-1 border ${errors.birthYear ? 'border-red-500' : 'border-gray-300'} rounded bg-white text-gray-800 focus:outline-none focus:border-gray-500`}
              required
            >
              <option value="">请选择</option>
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
            {errors.birthYear && <p className="text-red-500 text-xs mt-1">{errors.birthYear}</p>}
          </div>
          
          <div className="mb-2">
            <label className="block text-gray-700 text-sm mb-1">出生月 <span className="text-red-500">*</span></label>
            <select
              name="birthMonth"
              value={formData.birthMonth}
              onChange={handleChange}
              className={`w-full px-2 py-1 border ${errors.birthMonth ? 'border-red-500' : 'border-gray-300'} rounded bg-white text-gray-800 focus:outline-none focus:border-gray-500`}
              required
            >
              <option value="">请选择</option>
              {monthOptions.map(month => (
                <option key={month} value={month}>{month}月</option>
              ))}
            </select>
            {errors.birthMonth && <p className="text-red-500 text-xs mt-1">{errors.birthMonth}</p>}
          </div>
          
          <div className="mb-2">
            <label className="block text-gray-700 text-sm mb-1">出生日 <span className="text-red-500">*</span></label>
            <select
              name="birthDay"
              value={formData.birthDay}
              onChange={handleChange}
              className={`w-full px-2 py-1 border ${errors.birthDay ? 'border-red-500' : 'border-gray-300'} rounded bg-white text-gray-800 focus:outline-none focus:border-gray-500`}
              required
            >
              <option value="">请选择</option>
              {dayOptions.map(day => (
                <option key={day} value={day}>{day}日</option>
              ))}
            </select>
            {errors.birthDay && <p className="text-red-500 text-xs mt-1">{errors.birthDay}</p>}
          </div>
        </div>
        
        <div className="mb-3">
          <label className="block text-gray-700 text-sm mb-1">出生时辰 <span className="text-red-500">*</span></label>
          <select
            name="birthHour"
            value={formData.birthHour}
            onChange={handleChange}
            className={`w-full px-2 py-1 border ${errors.birthHour ? 'border-red-500' : 'border-gray-300'} rounded bg-white text-gray-800 focus:outline-none focus:border-gray-500`}
            required
          >
            <option value="">请选择</option>
            {hourOptions.map(hour => (
              <option key={hour} value={hour}>{hour}</option>
            ))}
          </select>
          {errors.birthHour && <p className="text-red-500 text-xs mt-1">{errors.birthHour}</p>}
        </div>
        
        <button
          type="submit"
          disabled={submitting}
          className={`w-full primary-btn py-2 rounded-lg font-medium flex items-center justify-center ${submitting ? 'opacity-70' : ''}`}
        >
          {submitting ? '提交中...' : '确认并继续'}
        </button>
      </form>
      
      <p className="text-xs text-gray-500 text-center mt-2">
        信息仅保存在您的设备上，用于提供更准确的命理分析
      </p>
    </div>
  </div>
  );
};

// Bottom Navigation Component
const BottomNavigation = ({ currentPage, setCurrentPage }: BottomNavigationProps) => {
  const navItems = [
    { id: 'home', label: '首页', icon: <Home size={20} /> },
    { id: 'chat', label: '问事', icon: <MessageCircleMore size={20} /> },
    { id: 'divination', label: '起卦', icon: <CircleHelp size={20} /> },
    { id: 'calendar', label: '黄历', icon: <Calendar size={20} /> },
    { id: 'fortune', label: '运势', icon: <BarChart2 size={20} /> },
    { id: 'profile', label: '我的', icon: <User size={20} /> }
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 nav-bar flex justify-around items-center shadow-lg">
      {navItems.map(item => (
        <div
          key={item.id}
          className={`flex-1 py-3 flex flex-col items-center ${
            currentPage === item.id ? 'text-white font-bold' : 'text-white opacity-80'
          }`}
          onClick={() => setCurrentPage(item.id)}
        >
          {item.icon}
          <span className="text-xs mt-1">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default App;
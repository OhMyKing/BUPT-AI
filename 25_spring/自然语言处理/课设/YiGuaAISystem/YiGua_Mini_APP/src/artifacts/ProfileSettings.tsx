import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { ArrowLeft, Save } from 'lucide-react';

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

interface ProfileSettingsProps {
  userInfo: UserInfo | null;
  setUserInfo: Dispatch<SetStateAction<UserInfo | null>>;
  setCurrentPage: Dispatch<SetStateAction<string>>;
}

const ProfileSettings = ({ userInfo, setUserInfo, setCurrentPage }: ProfileSettingsProps) => {
  const [formData, setFormData] = useState<UserInfo>({
    name: '',
    gender: '男',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    birthHour: ''
  });

  // 初始化表单数据
  useEffect(() => {
    if (userInfo) {
      setFormData({...userInfo});
    }
  }, [userInfo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 更新用户信息
    setUserInfo(formData);
    
    // 保存到 localStorage
    localStorage.setItem('userInfo', JSON.stringify(formData));
    
    // 返回个人中心页面
    setCurrentPage('profile');
  };

  const handleCancel = () => {
    // 返回个人中心页面，不保存更改
    setCurrentPage('profile');
  };

  // 生成选择项
  const yearOptions = Array.from({ length: 100 }, (_, i) => 2025 - i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);
  const hourOptions = ["未知","子时(23-1点)", "丑时(1-3点)", "寅时(3-5点)", "卯时(5-7点)", 
                      "辰时(7-9点)", "巳时(9-11点)", "午时(11-13点)", "未时(13-15点)", 
                      "申时(15-17点)", "酉时(17-19点)", "戌时(19-21点)", "亥时(21-23点)"];

  return (
    <div className="p-4">
      <header className="mb-4 flex items-center">
        <button onClick={handleCancel} className="mr-2">
          <ArrowLeft size={20} className="text-gray-800" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">编辑个人资料</h1>
      </header>
      
      <form onSubmit={handleSubmit} className="paper-card rounded-lg p-4">
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">姓名</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-800 focus:outline-none focus:border-gray-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">性别</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-800 focus:outline-none focus:border-gray-500"
            required
          >
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">出生年</label>
          <select
            name="birthYear"
            value={formData.birthYear}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-800 focus:outline-none focus:border-gray-500"
            required
          >
            <option value="">请选择</option>
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}年</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">出生月</label>
          <select
            name="birthMonth"
            value={formData.birthMonth}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-800 focus:outline-none focus:border-gray-500"
            required
          >
            <option value="">请选择</option>
            {monthOptions.map(month => (
              <option key={month} value={month}>{month}月</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">出生日</label>
          <select
            name="birthDay"
            value={formData.birthDay}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-800 focus:outline-none focus:border-gray-500"
            required
          >
            <option value="">请选择</option>
            {dayOptions.map(day => (
              <option key={day} value={day}>{day}日</option>
            ))}
          </select>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-1">出生时辰</label>
          <select
            name="birthHour"
            value={formData.birthHour}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-800 focus:outline-none focus:border-gray-500"
            required
          >
            <option value="">请选择</option>
            {hourOptions.map(hour => (
              <option key={hour} value={hour}>{hour}</option>
            ))}
          </select>
        </div>
        
        <button
          type="submit"
          className="w-full primary-btn flex items-center justify-center py-3 rounded-lg font-medium"
        >
          <Save size={16} className="mr-2" />
          保存修改
        </button>
      </form>
    </div>
  );
};

export default ProfileSettings;
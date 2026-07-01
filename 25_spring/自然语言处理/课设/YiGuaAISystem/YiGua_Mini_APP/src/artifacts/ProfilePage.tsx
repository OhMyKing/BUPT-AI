import React from 'react';
import { Dispatch, SetStateAction } from 'react';
import { ChevronRight } from 'lucide-react';

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

interface ProfilePageProps {
  userInfo?: UserInfo | null;
  setCurrentPage?: Dispatch<SetStateAction<string>>;
}

// Profile Page Component
const ProfilePage = ({ userInfo, setCurrentPage }: ProfilePageProps) => {
  
  const getBirthElements = () => {
    if (!userInfo) return "";
    return userInfo.birthMonth ? `${userInfo.birthMonth}月生` : "";
  };
  
  // 处理导航到个人资料设置页面
  const handleNavigateToSettings = () => {
    if (setCurrentPage) {
      setCurrentPage('profileSettings');
    }
  };

  // 处理导航到隐私政策页面
  const handleNavigateToPrivacyPolicy = () => {
    if (setCurrentPage) {
      setCurrentPage('privacyPolicy');
    }
  };

  // 处理导航到服务条款页面
  const handleNavigateToTermsOfService = () => {
    if (setCurrentPage) {
      setCurrentPage('termsOfService');
    }
  };

  // 处理导航到关于页面
  const handleNavigateToAbout = () => {
    if (setCurrentPage) {
      setCurrentPage('about');
    }
  };

  // 处理导航到反馈页面
  const handleNavigateToFeedback = () => {
    if (setCurrentPage) {
      setCurrentPage('feedback');
    }
  };
  
  return (
    <div className="p-4">
      <header className="mb-4">
        <h1 className="text-xl font-semibold text-center text-gray-800">个人中心</h1>
      </header>
      
      <div className="paper-card rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <div className="relative">
            <div className="h-16 w-16 bg-c06b5a rounded-full flex items-center justify-center text-white text-xl font-bold">
              {userInfo?.name?.charAt(0) || '客'}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white text-c06b5a text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border border-c06b5a">
              {userInfo?.gender || '男'}
            </div>
          </div>
          <div className="ml-4">
            <h2 className="font-semibold text-lg text-gray-800">{userInfo?.name || '游客'}</h2>
            <p className="text-gray-600 text-sm mt-1">
              {userInfo 
                ? `${userInfo.birthYear}年${userInfo.birthMonth}月${userInfo.birthDay}日 ${userInfo.birthHour}`
                : '未记录生辰'}
            </p>
            <div className="text-gray-700 text-sm mt-1">
              {getBirthElements()}
            </div>
          </div>
        </div>
      </div>
      
      {/* <div className="paper-card rounded-lg mb-4">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">测算记录</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {records.map(record => (
            <div key={record.id} className="p-4">
              <div className="flex justify-between mb-1">
                <span className="font-medium text-gray-800">{record.question}</span>
                <span className="text-gray-500 text-sm">{record.date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">卦象：{record.hexagram}</span>
                <span className="text-c06b5a">{record.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div> */}
      
      <div className="paper-card rounded-lg">
        <div className="divide-y divide-gray-100">
          <div 
            className="p-4 flex items-center justify-between cursor-pointer active:bg-gray-100" 
            onClick={handleNavigateToSettings}
          >
            <span className="text-gray-800">个人资料设置</span>
            <ChevronRight size={16} className="text-gray-500" />
          </div>
          <div 
            className="p-4 flex items-center justify-between cursor-pointer active:bg-gray-100"
            onClick={handleNavigateToPrivacyPolicy}
          >
            <span className="text-gray-800">隐私政策</span>
            <ChevronRight size={16} className="text-gray-500" />
          </div>
          <div 
            className="p-4 flex items-center justify-between cursor-pointer active:bg-gray-100"
            onClick={handleNavigateToTermsOfService}
          >
            <span className="text-gray-800">服务条款</span>
            <ChevronRight size={16} className="text-gray-500" />
          </div>
          <div 
            className="p-4 flex items-center justify-between cursor-pointer active:bg-gray-100"
            onClick={handleNavigateToAbout}
          >
            <span className="text-gray-800">关于易卦</span>
            <ChevronRight size={16} className="text-gray-500" />
          </div>
          <div 
            className="p-4 flex items-center justify-between cursor-pointer active:bg-gray-100"
            onClick={handleNavigateToFeedback}
          >
            <span className="text-gray-800">意见反馈</span>
            <ChevronRight size={16} className="text-gray-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
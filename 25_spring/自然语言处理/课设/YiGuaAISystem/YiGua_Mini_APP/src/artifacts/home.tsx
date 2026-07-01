import React, { useEffect, useState } from 'react';
import { Dispatch, SetStateAction } from 'react';
import { Calendar, User, Book, ChevronRight } from 'lucide-react';
import { getSimplifiedAlmanac, SimplifiedAlmanac, getSimplifiedFortune, SimplifiedFortune } from './tyme-utils';
import coin_front from '../img/coin_front.png';
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

interface HomePageProps {
  setCurrentPage: Dispatch<SetStateAction<string>>;
  userInfo?: UserInfo | null;
}

// 星级渲染
const renderStars = (rating: number) => {
  return (
    <div className="flex text-yellow-500">
      {Array(5).fill(0).map((_, i) => (
        <span key={i}>{i < rating ? '★' : '☆'}</span>
      ))}
    </div>
  );
};

// Home Page Component
const HomePage = ({ setCurrentPage, userInfo }: HomePageProps) => {
  const [almanacData, setAlmanacData] = useState<SimplifiedAlmanac | null>(null);
  const [fortuneData, setFortuneData] = useState<SimplifiedFortune | null>(null);
  
  // 获取今日黄历数据
  useEffect(() => {
    // 使用工具函数获取今日黄历数据
    const today = new Date();
    const almanac = getSimplifiedAlmanac(today);
    setAlmanacData(almanac);
    
    // 如果用户信息存在，获取今日运势数据
    if (userInfo) {
      const fortune = getSimplifiedFortune(userInfo);
      setFortuneData(fortune);
    }
  }, [userInfo]);
  
  
  return (
    <div>
      <div className="p-4">        
        <div className="grid grid-cols-2 gap-4 mt-2">
          {/* Today's Almanac - Clickable */}
          <div 
            className="paper-card rounded-lg p-4 col-span-1 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setCurrentPage('calendar')}
          >
            <div className="flex items-center justify-between mb-2 text-gray-800">
              <div className="flex items-center">
                <Calendar size={18} />
                <h2 className="ml-2 font-semibold">黄历</h2>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </div>
            {almanacData ? (
              <>
                <p className="text-sm text-gray-600 mb-2 border-b border-gray-200 pb-2">
                  {almanacData.date} <span className="text-gray-500 ml-1">({almanacData.lunar})</span>
                </p>
                <div className="text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">宜：</span>
                    <span className="text-green-700">{almanacData.yi.slice(0, 3).join('、')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">忌：</span>
                    <span className="text-red-700">{almanacData.ji.slice(0, 3).join('、')}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex justify-center items-center h-16">
                <div className="animate-pulse">加载中...</div>
              </div>
            )}
          </div>
          
          {/* My Fortune - Now Dynamic */}
          <div 
            className="paper-card rounded-lg p-4 col-span-1 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setCurrentPage('fortune')}
          >
            <div className="flex items-center justify-between mb-2 text-gray-800">
              <div className="flex items-center">
                <User size={18} />
                <h2 className="ml-2 font-semibold">运势</h2>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </div>
            <p className="text-sm text-gray-600 mb-2 border-b border-gray-200 pb-1">
              {userInfo?.name || '道友'}今日运势
            </p>
            {fortuneData ? (
              <>
                <div className="flex items-center text-yellow-500 mb-1">
                  {renderStars(fortuneData.rating)}
                </div>
                <p className="text-sm text-gray-700">{fortuneData.description}</p>
              </>
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center text-yellow-500 mb-1">
                  {renderStars(4)}
                </div>
                <p className="text-sm text-gray-700">
                  {userInfo ? '正在加载运势数据...' : '请完善个人信息查看运势'}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Ancient Coin Divination */}
        <div 
          className="primary-btn rounded-lg p-10 mt-4 cursor-pointer"
          onClick={() => setCurrentPage('divination')}
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-xl mb-1">铜钱起卦</h2>
              <h2 className="text-lg text-white opacity-90">六爻问事，掷币起卦</h2>
            </div>
            <div className="h-20 w-20 flex items-center justify-center bg-white bg-opacity-20 rounded-full">
              <img src={coin_front} alt="铜钱" className="h-20 w-20" />
            </div>
          </div>
        </div>

        <div 
          className="primary-btn rounded-lg p-10 mt-4 cursor-pointer"
          onClick={() => setCurrentPage('chat')}
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-xl mb-1">占卜问事</h2>
              <h2 className="text-lg text-white opacity-90">卜卦解惑，解惑命运</h2>
            </div>
            <div className="h-20 w-20 flex items-center justify-center bg-white bg-opacity-20 rounded-full">
              <img src={bagua} alt="八卦" className="h-20 w-20" />
            </div>
          </div>
        </div>
        
        {/* Recent Records */}
        {/* <div className="mt-6 paper-card rounded-lg p-4">
          <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
            <div className="flex items-center text-gray-800">
              <Book size={18} />
              <h2 className="ml-2 font-semibold">近期记录</h2>
            </div>
            <ChevronRight size={16} className="text-gray-600" />
          </div>
          
          <div className="divide-y divide-gray-100">
            <div className="py-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-800">失物能否找回？</span>
                <span className="text-gray-500 text-sm">05-09 巳时</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                <span className="text-gray-800">乾为天</span> - 物品将在一周内找回
              </p>
            </div>
            
            <div className="py-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-800">考试能否通过？</span>
                <span className="text-gray-500 text-sm">05-08 申时</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                <span className="text-gray-800">艮为山</span> - 需勤奋不懈，方有所成
              </p>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default HomePage;
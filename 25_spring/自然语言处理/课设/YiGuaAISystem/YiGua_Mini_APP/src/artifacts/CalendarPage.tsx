import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';
import { getAlmanacData, AlmanacData } from './tyme-utils';

interface CalendarPageProps {
  setCurrentPage: Dispatch<SetStateAction<string>>;
}

const CalendarPage = ({ setCurrentPage }: CalendarPageProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [almanacData, setAlmanacData] = useState<AlmanacData | null>(null);
  const [loading, setLoading] = useState(true);

  // Format dates for display
  const formattedSolarDate = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月${currentDate.getDate()}日`;
  const dayOfWeek = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][currentDate.getDay()];

  // Get almanac data using our utility function
  useEffect(() => {
    setLoading(true);
    
    try {
      // Get almanac data for the current date
      const data = getAlmanacData(currentDate);
      setAlmanacData(data);
    } catch (error) {
      console.error('Error generating almanac data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  // Handle date navigation
  const goToPreviousDay = () => {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setCurrentDate(prevDate);
  };

  const goToNextDay = () => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setCurrentDate(nextDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Show loading state while fetching data
  if (loading || !almanacData) {
    return (
      <div className="p-4">
        <div className="flex items-center mb-4">
          {/* <button 
            className="mr-2 p-2 rounded-full hover:bg-gray-100"
            onClick={() => setCurrentPage('home')}
          >
            <ArrowLeft size={20} />
          </button> */}
          <h1 className="text-xl font-semibold">黄历</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header with back button */}
      <div className="flex items-center mb-4">
        {/* <button 
          className="mr-2 p-2 rounded-full hover:bg-gray-100"
          onClick={() => setCurrentPage('home')}
        >
          <ArrowLeft size={20} />
        </button> */}
        <h1 className="text-xl font-semibold">黄历</h1>
      </div>

      {/* Date navigation */}
      <div className="flex justify-between items-center mb-4 p-3 paper-card rounded-lg">
        <button onClick={goToPreviousDay} className="p-1 rounded-full hover:bg-gray-100">
          <ChevronLeft size={22} />
        </button>
        <div className="flex items-center">
          <Calendar size={18} className="mr-2" />
          <span className="font-medium">{almanacData.solar}</span>
        </div>
        <button onClick={goToNextDay} className="p-1 rounded-full hover:bg-gray-100">
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Calendar content */}
      <div className="paper-card rounded-lg p-4 mb-4">
        <div className="flex flex-col space-y-2 mb-3 pb-3 border-b border-gray-200">
          <div className="text-lg font-medium">{almanacData.lunar}</div>
          <div className="text-sm text-gray-700">{almanacData.gz}</div>
        </div>

        {/* 宜忌 */}
        <div className="flex flex-col space-y-3 mb-3 pb-3 border-b border-gray-200">
          <div className="flex space-x-2">
            <span className="font-medium text-gray-700">宜：</span>
            <span className="text-green-700">{almanacData.yi.join('、')}</span>
          </div>
          <div className="flex space-x-2">
            <span className="font-medium text-gray-700">忌：</span>
            <span className="text-red-700">{almanacData.ji.join('、')}</span>
          </div>
        </div>

        {/* 详细信息表格 */}
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-3 w-1/3">
                <div><b>纳音</b><span className="ml-2">{almanacData.nayin}</span></div>
              </td>
              <td className="py-3 w-1/3">
                <div><b>冲煞</b><span className="ml-2">{almanacData.chongsha}</span></div>
              </td>
              <td className="py-3 w-1/3">
                <div><b>值神</b><span className="ml-2">{almanacData.zhishen}</span></div>
              </td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-3 align-top">
                <div><b>时辰吉凶</b></div>
              </td>
              <td colSpan={2} className="py-3">
                <div className="grid grid-cols-4 gap-2">
                  {almanacData.hourFortuneList.map((item, index) => (
                    <div key={index} className={`text-center py-1 px-2 rounded ${item.fortune === '吉' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.hour} {item.fortune}
                    </div>
                  ))}
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-3">
                <div><b>建除十二神</b></div>
              </td>
              <td colSpan={2} className="py-3">
                <div>收</div>
              </td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-3">
                <div><b>吉神宜趋</b></div>
              </td>
              <td colSpan={2} className="py-3">
                <div className="flex flex-wrap gap-2">
                  {almanacData.auspicious.map((item, index) => (
                    <div key={index} className="flex items-center mr-4">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-600 mr-1"></span>
                      {item}
                    </div>
                  ))}
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-3">
                <div><b>今日胎神</b></div>
              </td>
              <td colSpan={2} className="py-3">
                <div>{almanacData.taishen}</div>
              </td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-3">
                <div><b>凶神宜忌</b></div>
              </td>
              <td colSpan={2} className="py-3">
                <div className="flex flex-wrap gap-2">
                  {almanacData.inauspicious.map((item, index) => (
                    <div key={index} className="flex items-center mr-4">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-600 mr-1"></span>
                      {item}
                    </div>
                  ))}
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-3">
                <div><b>二十八星宿</b></div>
              </td>
              <td colSpan={2} className="py-3">
                <div>{almanacData.starSign}</div>
              </td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-3">
                <div><b>彭祖百忌</b></div>
              </td>
              <td colSpan={2} className="py-3">
                <div>{almanacData.pengzu}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Explanation section */}
      <div className="paper-card rounded-lg p-4">
        <h3 className="font-medium mb-2">黄历解读</h3>
        <p className="text-sm text-gray-700 mb-2">
          黄历是中国传统的历法与术数文化的产物，用于指导日常生活中的各项活动，选择吉日良辰。
        </p>
        <p className="text-sm text-gray-700">
          宜忌项目是根据当日五行、干支配合、神煞等多方面因素综合判定，仅供参考。
        </p>
      </div>
    </div>
  );
};

export default CalendarPage;
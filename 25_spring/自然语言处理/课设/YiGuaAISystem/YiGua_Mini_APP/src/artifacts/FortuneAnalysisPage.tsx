import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';
import { analyzeFortuneData, FortuneAnalysis, UserInfo, getFortuneTrend } from './tyme-utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FortuneAnalysisPageProps {
  setCurrentPage: Dispatch<SetStateAction<string>>;
  userInfo: UserInfo | null;
}

const FortuneAnalysisPage = ({ setCurrentPage, userInfo }: FortuneAnalysisPageProps) => {
  const [fortune, setFortune] = useState<FortuneAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fortuneTrend, setFortuneTrend] = useState<{ date: string; rating: number }[]>([]);

  useEffect(() => {
    loadFortuneData();
  }, []);

  /**
   * 加载运势数据
   */
  const loadFortuneData = () => {
    setLoading(true);
    setError(null);

    try {
      if (!userInfo) {
        throw new Error('缺少用户信息');
      }

      const fortuneData = analyzeFortuneData(userInfo);
      
      if (!fortuneData) {
        throw new Error('无法分析运势数据');
      }

      setFortune(fortuneData);
      
      // 加载运势趋势数据
      loadTrendData(userInfo);
    } catch (err) {
      console.error('Error loading fortune data:', err);
      setError(err instanceof Error ? err.message : '无法分析运势，请检查用户信息是否完整');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 加载运势趋势数据
   */
  const loadTrendData = (userInfo: UserInfo) => {
    try {
      const trendData = getFortuneTrend(userInfo, 7); // 获取前后7天的数据（共15天）
      setFortuneTrend(trendData);
    } catch (err) {
      console.error('Error loading fortune trend data:', err);
    }
  };

  // 渲染星级 - 使用实心和空心星星
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        size={18} 
        className={`${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-yellow-500'}`} 
      />
    ));
  };

  // 加载状态
  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center mb-4">
          <h1 className="text-xl font-semibold">今日运势</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse">分析运势中...</div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="p-4">
        <div className="flex items-center mb-4">
          <h1 className="text-xl font-semibold">今日运势</h1>
        </div>
        <div className="paper-card rounded-lg p-4 text-center">
          <div className="text-red-500 mb-3">{error}</div>
          <button 
            className="primary-btn py-2 px-4 rounded"
            onClick={() => setCurrentPage('profile')}
          >
            前往完善个人信息
          </button>
        </div>
      </div>
    );
  }

  if (!fortune) {
    return null;
  }

  return (
    <div className="p-4 pb-16">
      {/* Header with back button */}
      <div className="flex items-center mb-4">
        <h1 className="text-xl font-semibold">今日运势</h1>
      </div>

      {/* 运势评分 */}
      <div className="paper-card rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium">{userInfo?.name || '道友'}今日运势</h2>
            <p className="text-gray-600 text-sm">{fortune.todayAnalysis.date}</p>
          </div>
          <div className="flex">{renderStars(fortune.fortuneRating)}</div>
        </div>
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <p className="text-gray-800">{fortune.fortuneDescription}</p>
        </div>
      </div>

      {/* 运势趋势图 */}
      <div className="paper-card rounded-lg p-4 mb-4">
        <h2 className="text-lg font-medium mb-3">运势趋势</h2>
        <p className="text-sm text-gray-600 mb-3">过去7天和未来7天的运势变化趋势</p>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={fortuneTrend}
              margin={{ top: 5, right: 30, left: -30, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
              <Tooltip 
                formatter={(value) => [`${value}星`, '运势评分']}
                labelFormatter={(label) => `${label}日`}
              />
              <Line 
                type="monotone" 
                dataKey="rating" 
                stroke="#c06b5a" 
                strokeWidth={2}
                activeDot={{ r: 8 }}
                name="运势评分"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-2 text-center text-sm text-gray-500">
          运势指数 (1-5): 1分表示运势不佳，5分表示运势极好
        </div>
      </div>

      {/* 八字基本信息 */}
      <div className="paper-card rounded-lg p-4 mb-4">
        <h2 className="text-lg font-medium mb-3">八字信息</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">出生日期：</span>
            <span>{fortune.basicInfo.birthDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">八字：</span>
            <span>{fortune.basicInfo.eightChar}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">当前运势：</span>
            <span>{fortune.currentCycle.decadeFortune}大运，{fortune.currentCycle.fortune}流年</span>
          </div>
        </div>
      </div>

      {/* 今日详情 */}
      <div className="paper-card rounded-lg p-4 mb-4">
        <h2 className="text-lg font-medium mb-3">今日详情</h2>
        <div className="space-y-2 mb-3 pb-3 border-b border-gray-200">
          <div className="flex justify-between">
            <span className="text-gray-600">今日：</span>
            <span>{fortune.todayAnalysis.sixtyCycle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">天干关系：</span>
            <span>{fortune.todayAnalysis.stemRelation}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">地支关系：</span>
            <span>{fortune.todayAnalysis.branchRelation}</span>
          </div>
        </div>

        {/* 宜忌 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="font-medium mb-2 text-green-700">今日宜</p>
            <div className="flex flex-wrap gap-2">
              {fortune.todayAnalysis.recommendation.length > 0 ? (
                fortune.todayAnalysis.recommendation.map((item, index) => (
                  <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-gray-500">暂无</span>
              )}
            </div>
          </div>
          
          <div>
            <p className="font-medium mb-2 text-red-700">今日忌</p>
            <div className="flex flex-wrap gap-2">
              {fortune.todayAnalysis.avoidance.length > 0 ? (
                fortune.todayAnalysis.avoidance.map((item, index) => (
                  <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-gray-500">暂无</span>
              )}
            </div>
          </div>
        </div>

        {/* 吉神凶煞 */}
        <div className="mt-4">
          <p className="font-medium mb-2">吉神</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {fortune.todayAnalysis.auspiciousGods.length > 0 ? (
              fortune.todayAnalysis.auspiciousGods.map((god, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {god}
                </span>
              ))
            ) : (
              <span className="text-gray-500">暂无</span>
            )}
          </div>
          
          <p className="font-medium mb-2">凶神</p>
          <div className="flex flex-wrap gap-2">
            {fortune.todayAnalysis.inauspiciousGods.length > 0 ? (
              fortune.todayAnalysis.inauspiciousGods.map((god, index) => (
                <span key={index} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                  {god}
                </span>
              ))
            ) : (
              <span className="text-gray-500">暂无</span>
            )}
          </div>
        </div>
      </div>

      {/* 运势解读说明 */}
      <div className="paper-card rounded-lg p-4">
        <h3 className="font-medium mb-2">运势解读</h3>
        <p className="text-sm text-gray-700 mb-2">
          八字运势分析是根据您的出生年月日时（四柱八字）与当日天干地支的相互关系，结合传统命理学理论进行推断。
        </p>
        <p className="text-sm text-gray-700">
          以上分析仅供参考，建议将运势分析作为日常决策的参考，而不是唯一依据。
        </p>
      </div>
    </div>
  );
};

export default FortuneAnalysisPage;
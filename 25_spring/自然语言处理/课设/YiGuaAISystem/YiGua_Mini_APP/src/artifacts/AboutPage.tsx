import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';
import bagua from '../img/bagua.png';

interface AboutPageProps {
  setCurrentPage: Dispatch<SetStateAction<string>>;
}

const AboutPage = ({ setCurrentPage }: AboutPageProps) => {
  return (
    <div className="p-4">
      <header className="mb-4 flex items-center">
        <button onClick={() => setCurrentPage('profile')} className="mr-2">
          <ArrowLeft size={20} className="text-gray-800" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">关于易卦</h1>
      </header>
      
      <div className="paper-card rounded-lg p-4 mb-4 flex flex-col items-center">
        <img src={bagua} alt="易卦" className="h-24 w-24 mb-3" />
        <h2 className="text-xl title-font text-gray-800 mb-1">易卦</h2>
        <p className="text-gray-500 text-sm mb-3">版本 1.0.0</p>
        <div className="w-12 h-1 bg-c06b5a rounded my-2"></div>
        <p className="text-center text-gray-700 mt-2">
          传承千年智慧，易学入门良伴
        </p>
      </div>
      
      <div className="paper-card rounded-lg p-4">
        <h3 className="font-semibold mb-3">应用介绍</h3>
        <p className="text-gray-700 mb-4">
          "易卦"是一款基于中国传统易学理论开发的命理分析工具，致力于将古老的易学智慧以现代化的方式呈现给用户。
        </p>
        
        <h3 className="font-semibold mb-3">功能特色</h3>
        <ul className="list-disc pl-5 mb-4 text-gray-700">
          <li className="mb-2">黄历查询：每日宜忌、吉凶神煞、时辰吉凶等信息</li>
          <li className="mb-2">起卦占卜：铜钱起卦、八卦解读、专业解析</li>
          <li className="mb-2">个人运势：基于八字的个人运势分析</li>
          <li className="mb-2">占卜问事：与虚拟道长对话，解析命理疑问</li>
        </ul>
        
        <h3 className="font-semibold mb-3">开发团队</h3>
        <p className="text-gray-700 mb-1">
          易卦是由一群热爱中国传统文化的程序开发者和易学爱好者共同开发完成的。
        </p>
        <p className="text-gray-700 mb-4">
          我们希望通过现代科技的手段，将中华文化的瑰宝传承下去，让更多的人了解和爱上易学文化。
        </p>
        
        <h3 className="font-semibold mb-3">免责声明</h3>
        <p className="text-gray-700 mb-1">
          易卦应用提供的命理分析和解读仅供参考和娱乐，不构成任何决策建议。
        </p>
        <p className="text-gray-700 mb-4">
          请用户理性看待占卜结果，不要将其作为生活、工作或重大决策的唯一依据。
        </p>
        
        <h3 className="font-semibold mb-3">联系我们</h3>
        <p className="text-gray-700">
          邮箱：quarkwang@163.com<br />
        </p>
        
        <div className="flex justify-center mt-6">
          <p className="text-gray-500 text-sm">
            Copyright © 2025 易卦团队 版权所有
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
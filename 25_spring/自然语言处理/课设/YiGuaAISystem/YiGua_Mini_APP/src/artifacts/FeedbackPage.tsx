import React from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

interface FeedbackPageProps {
  setCurrentPage: Dispatch<SetStateAction<string>>;
}

const FeedbackPage = ({ setCurrentPage }: FeedbackPageProps) => {
  // 处理邮件反馈
  const handleEmailFeedback = () => {
    window.location.href = 'mailto:quarkwang@163.com?subject=易卦应用意见反馈';
  };
  
  return (
    <div className="p-4">
      <header className="mb-4 flex items-center">
        <button onClick={() => setCurrentPage('profile')} className="mr-2">
          <ArrowLeft size={20} className="text-gray-800" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">意见反馈</h1>
      </header>
      
      <div className="paper-card rounded-lg p-4">
        <div className="flex flex-col items-center justify-center p-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">感谢您的宝贵意见</h2>
            <p className="text-gray-600 mb-4">
              我们非常重视每一位用户的意见与建议。如果您有任何问题、建议或发现了任何错误，欢迎随时联系我们。
            </p>
            <p className="text-gray-700 font-medium mb-2">
              请发送邮件至：
            </p>
            <p className="text-c06b5a font-semibold text-lg mb-6">
              quarkwang@163.com
            </p>
          </div>
          
          <button 
            onClick={handleEmailFeedback}
            className="primary-btn py-3 px-6 rounded-lg font-medium flex items-center justify-center"
          >
            <Mail size={18} className="mr-2" />
            发送邮件反馈
          </button>
        </div>
        
        <div className="mt-6 border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600">
            我们会认真阅读每一条反馈，并尽快回复。您的意见将帮助我们不断改进和完善易卦应用。
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
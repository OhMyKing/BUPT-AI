import React, { useRef, useState, useEffect } from 'react';
import { Dispatch, SetStateAction } from 'react';
import { RotateCcw, MessageSquare } from 'lucide-react';
import CoinTossWrapper from './coin';
import { HexagramData, getHexagramByLines, getHexagramInterpretation, getHexagramByNumber } from './hexagrams';
import HexagramDisplay from './HexagramDisplay';
import { CoinResult, DivinationResult, questionTypes } from './divinationTypes';

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

interface DivinationPageProps {
  setCurrentPage: Dispatch<SetStateAction<string>>;
  userInfo?: UserInfo | null;
  onDivinationComplete?: (result: DivinationResult) => void;
  // 新增函数来设置初始问题
  setInitialChatQuestion?: (question: string) => void;
}

// 添加接口定义
interface Hexagram {
  lines: {
    base: string;
    changing: boolean;
  }[];
  name: string;
  description: string;
  interpretation: string;
  specificInterpretation?: string;
  number: number;
}

// 创建一个会话ID记录变量，用于检测页面重新访问
let currentSessionId = '';

// Divination Page Component
const DivinationPage = ({ setCurrentPage, userInfo, onDivinationComplete, setInitialChatQuestion }: DivinationPageProps) => {
  const [step, setStep] = useState(1);
  const [question, setQuestion] = useState('');
  const [questionType, setQuestionType] = useState('');
  const [coinResults, setCoinResults] = useState<CoinResult[]>([]);
  const [hexagram, setHexagram] = useState<Hexagram | null>(null);
  const [tossCount, setTossCount] = useState(0);
  const coinResultsRef = useRef<CoinResult[]>([]);
  
  // 为每次组件挂载创建一个唯一的会话ID
  const sessionIdRef = useRef<string>(`session-${Date.now()}`);
  
  // 标记是否需要重置场景
  const [needReset, setNeedReset] = useState(false);
  
  // 组件挂载时检查是否需要重置
  useEffect(() => {
    console.log("DivinationPage 组件已挂载，会话ID:", sessionIdRef.current);
    
    // 检查全局会话ID是否变化，确定是否需要重置场景
    if (currentSessionId !== sessionIdRef.current) {
      console.log("检测到新会话，需要重置场景");
      setNeedReset(true);
      // 更新全局会话ID
      currentSessionId = sessionIdRef.current;
    } else {
      console.log("相同会话，无需重置场景");
      setNeedReset(false);
    }
    
    // 重置所有状态
    resetDivination();
    
    return () => {
      console.log("DivinationPage 组件已卸载");
    };
  }, []);
  
  // 处理硬币结果
  const handleCoinResult = (result: CoinResult) => {
    console.log('收到硬币结果:', result);
    
    // 同时更新state和ref
    coinResultsRef.current = [...coinResultsRef.current, result];
    setCoinResults(prevResults => [...prevResults, result]);
    setTossCount(prevCount => prevCount + 1);
  };
  
  // 完成所有硬币投掷后的处理
  const handleCoinComplete = () => {
    // 使用ref中存储的结果，确保包含所有六次投掷
    const hexagramResult = determineHexagram(coinResultsRef.current);
    setStep(3); // 移至卦象解释步骤
    
    // 如果提供了完成回调，传递占卜结果
    if (onDivinationComplete && hexagramResult) {
      const divinationResult: DivinationResult = {
        hexagramNumber: hexagramResult.number,
        hexagramName: hexagramResult.name,
        lines: hexagramResult.lines,
        question,
        questionType,
        timestamp: Date.now()
      };
      
      onDivinationComplete(divinationResult);
    }
  };
  
  const determineHexagram = (results: CoinResult[]) => {
    // 将硬币结果转换为卦象爻位
    const lines = results.map(r => {
      // 硬币结果转换为爻位类型
      // 传统对应关系:
      // 6 = 老阴 (changing yin) - 三个反面（值为3）
      // 7 = 少阳 (stable yang) - 两个反面一个正面（值为2）
      // 8 = 少阴 (stable yin) - 两个正面一个反面（值为1）
      // 9 = 老阳 (changing yang) - 三个正面（值为0）
      
      // 获取硬币中反面的数量
      const lineType = r.lineType;
      
      // 修正映射关系，使其与coin.tsx中的定义一致
      if (lineType === 3) return { base: 'yin', changing: false };   // 3=少阴 (stable yin)
      if (lineType === 2) return { base: 'yin', changing: true };    // 2=老阴 (changing yin)
      if (lineType === 1) return { base: 'yang', changing: true };   // 1=老阳 (changing yang)
      if (lineType === 0) return { base: 'yang', changing: false };  // 0=少阳 (stable yang)
      
      // 如果出现意外情况，使用默认值
      console.error('意外的硬币结果:', r);
      return { base: 'yang', changing: false }; 
    });
    
    // 其余代码保持不变...
    const baseLines = lines.map(line => line.base);
    console.log('查询用的基本爻型（从下到上）:', baseLines);
    
    // 从hexagrams.tsx中获取卦象数据
    const hexagramData = getHexagramByLines(baseLines);
    console.log('查询结果:', hexagramData);
    
    if (hexagramData) {
      // 获取针对特定问题类型的解释
      const specificInterpretation = getHexagramInterpretation(hexagramData, questionType);
      
      const result = {
        lines: lines.reverse(), // 反转回来以便正确显示（从下到上）
        name: hexagramData.name,
        description: hexagramData.description,
        interpretation: hexagramData.interpretation,
        specificInterpretation: specificInterpretation,
        number: hexagramData.number
      };
      
      setHexagram(result);
      return result;
    } else {
      console.error('未能找到匹配的卦象，使用默认值');
      // 如果找不到对应的卦象，使用默认值
      const defaultHexagram = getHexagramByNumber(1);
      const fallbackResult = {
        lines: lines.reverse(), // 反转回来以便正确显示
        name: defaultHexagram ? defaultHexagram.name : '未识别卦象',
        description: defaultHexagram ? defaultHexagram.description : '卦象未能识别',
        interpretation: defaultHexagram ? defaultHexagram.interpretation : '请重新起卦或咨询专业人士。',
        number: defaultHexagram ? defaultHexagram.number : 1
      };
      
      setHexagram(fallbackResult);
      return fallbackResult;
    }
  };
  
  // Reset divination state
  const resetDivination = () => {
    setStep(1);
    setQuestion('');
    setQuestionType('');
    setCoinResults([]);
    coinResultsRef.current = []; // 重置ref
    setHexagram(null);
    setTossCount(0);
  };
  
  // 新增：处理专家解卦按钮点击
  const handleExpertAnalysisClick = () => {
    if (hexagram) {
      // 构造要发送到聊天页面的问题
      const questionTypeLabel = questionTypes.find(t => t.id === questionType)?.label || '未指定类型';
      const initialQuestion = `请解析我刚才得到的卦象：
      
卦名：${hexagram.name}
问题类型：${questionTypeLabel}
具体问题：${question}

请详细解释这个卦象对我的具体问题有什么指导意义？`;

      // 如果提供了设置初始问题的函数，则设置初始问题
      if (setInitialChatQuestion) {
        setInitialChatQuestion(initialQuestion);
      }
      
      // 跳转到聊天页面
      setCurrentPage('chat');
    }
  };
  
  // 在needReset更改后清除状态，避免重复重置
  useEffect(() => {
    if (needReset) {
      // 设置一个短暂的延时，确保标记被正确处理
      const timer = setTimeout(() => {
        setNeedReset(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [needReset]);
  
  return (
    <div className="p-4">
      <header className="mb-4">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-center text-gray-800 w-full">起卦</h1>
        </div>
      </header>
      
      {step === 1 && (
        <div className="paper-card rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 text-center">选择问题类型</h2>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            {questionTypes.map(type => (
              <div
                key={type.id}
                className={`border rounded-lg p-3 text-center cursor-pointer transition-all ${
                  questionType === type.id
                    ? 'bg-opacity-10 text-c06b5a'
                    : 'border-gray-300 text-gray-700'
                }`}
                style={{
                  borderColor: questionType === type.id ? '#c06b5a' : '#d1d5db',
                  backgroundColor: questionType === type.id ? 'rgba(192, 107, 90, 0.1)' : 'transparent'
                }}
                onClick={() => setQuestionType(type.id)}
              >
                {type.label}
              </div>
            ))}
          </div>
          
          <div className="mb-5">
            <label className="block text-gray-700 mb-1">占问之事</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-800 focus:outline-none focus:border-gray-500"
              placeholder={questionType ? questionTypes.find(t => t.id === questionType)?.placeholder : "请述明您要占问之事"}
              required
            />
          </div>
          
          <button
            onClick={() => setStep(2)}
            disabled={!question.trim()}
            className={`w-full py-3 rounded-lg font-medium ${
              question.trim() 
              ? 'primary-btn' 
              : 'bg-gray-300 text-gray-500'
            }`}
          >
            开始起卦
          </button>
        </div>
      )}
      
      {step === 2 && (
        <div className="paper-card rounded-lg p-4">
          <p className="text-gray-600 mb-4">请在心中默念您的问题，点击铜币或摇动手机起卦</p>
          
          <div className="relative mb-6 flex justify-center" style={{ minHeight: "400px" }}>
            {/* 传递needReset标记，指示是否需要重置场景 */}
            <CoinTossWrapper 
              key={`coin-toss-${sessionIdRef.current}`}
              onResult={handleCoinResult}
              onComplete={handleCoinComplete}
              tossCount={tossCount}
              maxTosses={6}
              needReset={needReset} // 新增参数，通知CoinTossWrapper是否需要重置
            />
          </div>
          
          {/* 显示已掷出的卦象 */}
          <div className="mb-4">
            <h3 className="text-center font-semibold text-gray-800 mb-3">当前卦象</h3>
            <div className="flex justify-center">
              <div className="space-y-2 w-100">
                {/* 从下往上显示卦象爻位 */}
                {coinResults.slice().reverse().map((result, index) => {
                  const actualIndex = coinResults.length - 1 - index;
                  const isYang = result.lineType === 0 || result.lineType === 1;
                  const isChanging = result.lineType === 1 || result.lineType === 2;
                  
                  return (
                    <div key={actualIndex} className="flex items-center justify-between h-8"> {/* 设置固定高度 */}
                      {isYang ? (
                        <div className="yang-line w-60"></div>
                      ) : (
                        <div className="flex justify-between w-60">
                          <div className="yin-line-part w-24"></div>
                          <div className="yin-line-part w-24"></div>
                        </div>
                      )}
                      <span className="ml-2 text-xs text-gray-600 w-10 text-center"> {/* 固定宽度和居中 */}
                        {isChanging ? (isYang ? '○' : '×') : '\u00A0'} {/* 使用不换行空格 */}
                      </span>
                    </div>
                  );
                })}
                
                {/* 显示剩余的空爻位 */}
                {Array(6 - coinResults.length).fill(null).map((_, index) => (
                  <div key={`empty-${index}`} className="flex items-center justify-between h-8 opacity-30 w-100"> {/* 相同高度 */}
                    <div className="yang-line w-60 bg-gray-300"></div>
                    <span className="ml-2 text-xs text-gray-400 w-10 text-center">待掷</span> {/* 相同宽度 */}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {step === 3 && hexagram && (
        <div className="paper-card rounded-lg p-4">
          <h2 className="text-lg font-semibold text-center text-gray-800 mb-3">卦象显示</h2>
          
          <div className="mb-4 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{hexagram.name}</h3>
            <p className="text-gray-600 italic">{hexagram.description}</p>
          </div>
          
          <div className="mb-6 flex justify-center">
            <HexagramDisplay lines={hexagram.lines} size="medium" showChanging={true} />
          </div>
          
          <div className="border-t border-gray-200 pt-4 mb-5">
            <h3 className="font-semibold text-gray-800 mb-3">卦辞解析</h3>
            <p className="text-gray-700 mb-4">
              {hexagram.interpretation}
            </p>
            
            <h3 className="font-semibold text-gray-800 mb-3">针对问题的解析</h3>
            <div className="text-gray-700">
              <p>
                {hexagram.specificInterpretation || '此卦象寓意深远，具体含义需结合您的实际情况分析。建议点击"详细解析"获取更深入的指导。'}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={resetDivination}
              className="flex-1 py-3 bg-gray-200 border border-gray-300 text-gray-700 rounded-lg font-medium flex justify-center items-center"
            >
              <RotateCcw size={16} className="mr-1" />
              重新起卦
            </button>
            
            <button
              onClick={handleExpertAnalysisClick} // 修改为新的处理函数
              className="flex-1 py-3 primary-btn rounded-lg font-medium flex justify-center items-center"
            >
              <MessageSquare size={16} className="mr-1" />
              专家解卦
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export { DivinationPage };
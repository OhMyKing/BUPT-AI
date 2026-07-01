import React, { useEffect, useRef, useState } from 'react';
import { createCoinTossComponent } from '../coin/renderer/index.js';

interface CoinTossInstance {
  destroy: () => void;
  reset?: () => void;
  getState?: () => {
    status: string;
    results: any[];
  }
}

// 硬币的结果类型定义，与coinState.ts中保持一致
type CoinResult = '正面' | '反面' | null;
type TossingStatus = 'INITIAL' | 'TOSSING' | 'FINISHED';

interface CoinEventResult {
  status: TossingStatus;
  results: CoinResult[];
}

// 我们在六爻模型中需要的简化结果
interface CoinResultDetail {
  coins: number[];  // 0表示阳(正面)，1表示阴(反面)
  sum: number;      // 硬币正反面总和
  lineType: number; // 0=少阳, 1=老阳, 2=老阴, 3=少阴
}

interface CoinTossProps {
  onResult?: (result: CoinResultDetail) => void;
  onComplete?: () => void;
  tossCount?: number;
  maxTosses?: number;
  needReset?: boolean; // 新增，是否需要重置场景
}

// 标记上一次创建的实例ID，用于检测是否是新会话
let lastCreatedInstanceId = null;

function CoinTossWrapper({ onResult, onComplete, tossCount = 0, maxTosses = 6, needReset = false }: CoinTossProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const coinTossInstanceRef = useRef<CoinTossInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // 添加一个状态标记来跟踪是否已经处理过当前硬币结果
  const processedResultRef = useRef<string | null>(null);
  // 添加一个内部计数器来跟踪实际的掷硬币次数
  const internalTossCountRef = useRef<number>(0);
  // 添加一个标志来防止多次调用onComplete
  const completeCalledRef = useRef<boolean>(false);
  // 创建一个实例ID，用于标识此组件实例
  const instanceIdRef = useRef<string>(`coin-instance-${Date.now()}`);
  // 用于跟踪是否已经应用了重置
  const resetAppliedRef = useRef<boolean>(false);
  
  // 重置完成状态的引用
  useEffect(() => {
    if (tossCount === 0) {
      completeCalledRef.current = false;
      internalTossCountRef.current = 0;
    }
  }, [tossCount]);
  
  // 检测needReset变化，确保只在真正的重置需求时重置场景
  useEffect(() => {
    // 只有当needReset为true且尚未应用重置时才重置
    if (needReset && !resetAppliedRef.current) {
      console.log("检测到需要重置场景，应用重置...");
      
      // 如果已有实例，先销毁
      if (coinTossInstanceRef.current) {
        coinTossInstanceRef.current.destroy();
        coinTossInstanceRef.current = null;
      }
      
      // 标记重置已应用
      resetAppliedRef.current = true;
      
      // 重新初始化硬币组件
      if (containerRef.current) {
        initializeCoinToss(true); // 传递forceReset参数
      }
    }
  }, [needReset]);
  
  // 初始化硬币组件的函数
  const initializeCoinToss = (forceReset = false) => {
    if (!containerRef.current) return;
    
    try {
      // 确保容器有一个唯一ID
      const container = containerRef.current;
      if (!container.id) {
        container.id = 'coin-toss-container';
      }
      
      console.log(`初始化硬币组件 (forceReset: ${forceReset}), 实例ID: ${instanceIdRef.current}`);
      
      // 检查是否处于新会话 (通过比较实例ID)
      const isNewSession = lastCreatedInstanceId !== instanceIdRef.current;
      lastCreatedInstanceId = instanceIdRef.current;
      
      // 创建硬币实例 - 修改createCoinTossComponent调用，传入额外参数
      const coinTossInstance = (typeof createCoinTossComponent === 'function') 
        ? (
            // 如果函数支持第二个参数，使用它表示是否强制重置
            createCoinTossComponent.length >= 2 
              ? createCoinTossComponent(container.id, isNewSession || forceReset) 
              : createCoinTossComponent(container.id)
          )
        : createCoinTossComponent(container.id);
      
      coinTossInstanceRef.current = coinTossInstance as CoinTossInstance;
      
      // 如果是新会话或强制重置，并且实例有reset方法，立即调用
      if ((isNewSession || forceReset) && coinTossInstance.reset) {
        console.log("新会话或强制重置，重置硬币状态");
        coinTossInstance.reset();
      }
      
      setIsReady(true);
      
      // 监听硬币状态变化事件
      const handleCoinTossState = (event: Event) => {
        const coinEvent = event as CustomEvent<CoinEventResult>;
        console.log('硬币状态:', coinEvent.detail);
        
        // 当硬币完成翻转，状态是FINISHED
        if (coinEvent.detail?.status === 'FINISHED') {
          setIsFlipping(false);
          
          // 创建一个结果签名，用于去重
          const resultSignature = coinEvent.detail.results.join('-');
          
          // 检查是否已经处理过这个结果
          if (processedResultRef.current === resultSignature) {
            console.log('结果已处理，跳过重复处理');
            return;
          }
          
          // 标记这个结果已被处理
          processedResultRef.current = resultSignature;
          
          // 将硬币结果转换为数字格式 (HEADS->0阳, TAILS->1阴)
          const coins = coinEvent.detail.results.map(result => 
            result === '正面' ? 0 : 1
          ) as number[];
          
          // 计算结果总和
          const sum = coins.reduce((a, b) => a + b, 0);
          
          // 创建符合六爻起卦的结果对象
          const result: CoinResultDetail = {
            coins,
            sum,
            lineType: sum // 0=少阳, 1=老阳, 2=老阴, 3=少阴
          };
          
          // 调用回调函数
          if (onResult) {
            onResult(result);
            
            // 使用内部计数器来跟踪掷硬币次数
            internalTossCountRef.current += 1;
            
            // 在最后一次投掷结果被处理后再调用onComplete
            if (internalTossCountRef.current >= maxTosses && onComplete && !completeCalledRef.current) {
              // 设置标志，确保onComplete只被调用一次
              completeCalledRef.current = true;
              
              // 使用setTimeout确保状态更新后再调用onComplete
              setTimeout(() => {
                onComplete();
              }, 0);
            }
          }
        } 
        else if (coinEvent.detail?.status === 'TOSSING') {
          setIsFlipping(true);
          // 重置处理标记，为下一次结果做准备
          processedResultRef.current = null;
        }
      };
      
      // 创建一个带命名空间的事件名称，避免事件冲突
      const eventName = 'cointossstate';
      
      // 为确保不会添加重复的事件监听器，先移除旧的
      container.removeEventListener(eventName, handleCoinTossState as EventListener);
      // 然后添加新的
      container.addEventListener(eventName, handleCoinTossState as EventListener);
      
      return () => {
        // 组件卸载时清理
        container.removeEventListener(eventName, handleCoinTossState as EventListener);
      };
    } catch (error) {
      console.error('初始化硬币组件失败:', error);
      setErrorMessage('无法加载硬币组件，请检查浏览器是否支持WebGL');
    }
  };
  
  // 初始化硬币组件
  useEffect(() => {
    const cleanup = initializeCoinToss(needReset);
    
    return () => {
      // 调用之前返回的清理函数（如果有）
      if (cleanup) cleanup();
      
      // 确保在组件卸载时彻底清理
      if (coinTossInstanceRef.current) {
        coinTossInstanceRef.current.destroy();
        coinTossInstanceRef.current = null;
      }
    };
  }, [onResult, onComplete, maxTosses]);
  
  // 处理直接点击硬币
  const handleDirectClick = () => {
    // 不需要额外处理，事件会直接传递给three.js画布
    // 这里只设置动画状态用于UI反馈
    if (!isFlipping && isReady) {
      setIsFlipping(true);
    }
  };
  
  // 公开重置方法，供外部组件调用
  const resetCoinToss = () => {
    if (coinTossInstanceRef.current && coinTossInstanceRef.current.reset) {
      coinTossInstanceRef.current.reset();
      processedResultRef.current = null;
      internalTossCountRef.current = 0;
      completeCalledRef.current = false;
    }
  };
  
  // 将reset方法暴露给父组件
  useEffect(() => {
    if (coinTossInstanceRef.current) {
      // 在组件实例上添加reset方法
      (containerRef.current as any).__resetCoinToss = resetCoinToss;
    }
    
    return () => {
      // 清理
      if (containerRef.current) {
        (containerRef.current as any).__resetCoinToss = undefined;
      }
    };
  }, [isReady]);
  
  return (
    <div className="flex flex-col items-center w-full h-full">
      {errorMessage ? (
        <div className="text-red-500 p-4 text-center border border-red-300 rounded-lg bg-red-50 w-full">
          {errorMessage}
        </div>
      ) : (
        <>
          <div 
            id="coin-toss-container" 
            ref={containerRef} 
            onClick={handleDirectClick}
            className="w-full border border-amber-200 rounded-lg overflow-hidden bg-gradient-to-b from-amber-50 to-amber-100"
            style={{ 
              height: "50vh",
              position: 'relative',
              isolation: 'isolate',
              zIndex: 1,
              flex: "1 1 auto",
              cursor: isFlipping ? 'default' : 'pointer'
            }}
          />
          
          {internalTossCountRef.current >= 0 && (
            <div className="mt-2 text-gray-700 text-sm">
              已完成 {internalTossCountRef.current}/{maxTosses} 次
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CoinTossWrapper;
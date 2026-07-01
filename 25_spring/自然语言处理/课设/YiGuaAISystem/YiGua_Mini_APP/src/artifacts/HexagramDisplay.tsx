import React from 'react';

// 卦象爻位类型
interface HexagramLine {
  base: string;
  changing: boolean;
}

// 组件属性
interface HexagramDisplayProps {
  lines: HexagramLine[];
  size?: 'small' | 'medium' | 'large';
  showChanging?: boolean;
}

/**
 * 卦象展示组件
 * 用于展示六爻卦象及其变爻
 */
const HexagramDisplay: React.FC<HexagramDisplayProps> = ({ 
  lines, 
  size = 'medium',
  showChanging = true 
}) => {
  // 根据尺寸确定样式
  const getStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: 'w-16',
          lineGap: 'space-y-1',
          yangLine: 'h-1.5',
          yinLine: 'h-1.5',
          yinGap: 'w-1',
          changingSymbol: 'text-xs'
        };
      case 'large':
        return {
          container: 'w-40',
          lineGap: 'space-y-4',
          yangLine: 'h-3',
          yinLine: 'h-3',
          yinGap: 'w-3',
          changingSymbol: 'text-lg'
        };
      default: // medium
        return {
          container: 'w-28',
          lineGap: 'space-y-3',
          yangLine: 'h-2',
          yinLine: 'h-2',
          yinGap: 'w-2',
          changingSymbol: 'text-sm'
        };
    }
  };
  
  const styles = getStyles();

  return (
    <div className={`${styles.container} ${styles.lineGap}`}>
      {/* 从上到下显示卦象六爻 */}
      {lines.slice().reverse().map((line, index) => (
        <div key={index} className="flex items-center">
          {line.base === 'yang' ? (
            // 阳爻：实线
            <div className={`yang-line w-full bg-gray-800 ${styles.yangLine} rounded-sm`}></div>
          ) : (
            // 阴爻：中断的线
            <div className="flex justify-between w-full">
              <div className={`yin-line-part w-5/12 bg-gray-800 ${styles.yinLine} rounded-sm`}></div>
              <div className={`${styles.yinGap}`}></div>
              <div className={`yin-line-part w-5/12 bg-gray-800 ${styles.yinLine} rounded-sm`}></div>
            </div>
          )}
          
          {/* 变爻符号 */}
          {showChanging && line.changing && (
            <div className={`text-c06b5a ml-2 ${styles.changingSymbol}`}>
              {line.base === 'yang' ? '○' : '×'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default HexagramDisplay;
import React, { useState, useEffect, useRef } from 'react';
import GlassCard from '@layout/GlassCard';
import TempControl from '@components/ac_controller/TempControl';
import FanSpeedSelector from '@components/ac_controller/FanSpeedSelector';
import ModeIcon from '@components/ac_controller/ModeIcon';

const ACControlPanel = ({
    id,
    temperature,
    mode,
    isOn,
    fanSpeed,
    isSwingOn,
    onAdjust,
    roomTemperature
}) => {
    // 添加本地温度状态
    const [localTemp, setLocalTemp] = useState(temperature);
    const isPendingRef = useRef(false);
    const lastServerTemp = useRef(temperature);

    // 当服务器温度更新时，检查是否需要更新本地温度
    useEffect(() => {
        if (!isPendingRef.current && temperature !== lastServerTemp.current) {
            setLocalTemp(temperature);
            lastServerTemp.current = temperature;
        }
    }, [temperature]);

    // 修改为使用统一的 onAdjust 处理状态更新
    const handleStateChange = async (newState) => {
        // 如果包含温度变化，立即更新本地显示
        if (newState.temperature !== undefined) {
            setLocalTemp(newState.temperature);
            isPendingRef.current = true;
        }

        try {
            // 确定扫风状态
            let sweepStatus = isSwingOn;  // 默认使用当前状态
            if (newState.isSwingOn !== undefined) {
                sweepStatus = newState.isSwingOn;  // 如果有新状态，使用新状态
            }

            // 发送状态更新到服务器
            await onAdjust({
                temperature: newState.temperature || localTemp,
                power: (newState.isOn !== undefined ? newState.isOn : isOn) ? 'on' : 'off',
                windSpeed: newState.fanSpeed || fanSpeed,
                sweep: sweepStatus ? '开' : '关'  // 简化的条件判断
            });
        } catch (error) {
            // 如果发生错误，回滚到最后一个已知的服务器温度
            if (newState.temperature !== undefined) {
                setLocalTemp(lastServerTemp.current);
            }
            // 可以添加错误提示
            console.error('Failed to update AC state:', error);
        } finally {
            isPendingRef.current = false;
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex gap-6">
                {/* 温度显示卡片 - 修改这部分 */}
                <GlassCard className="flex-1 flex flex-col justify-between relative">
                    {/* 添加室温显示在左上角 */}
                    <div className="absolute left-8 top-7 flex items-center">
                        <span className="text-white text-opacity-80 text-lg">室温</span>
                        <span className="text-white ml-2 text-xl font-medium">{roomTemperature}°C</span>
                    </div>

                    <div className="h-40 flex items-center justify-center">
                        <div className="w-60 text-center">
                            <span className={`text-8xl font-bold text-white leading-none transition-opacity duration-300 ${
                                isOn ? 'opacity-100' : 'opacity-50'
                            }`}>
                                {localTemp}°C
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center">
                            <div className="mr-4">
                                <ModeIcon mode={mode} isOn={isOn}/>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">空调控制器</h2>
                                <p className="text-white text-opacity-80">
                                    {isOn ? `当前模式: ${mode}` : '已关闭'}
                                </p>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* 温度与开关控制卡片 */}
                <GlassCard className="flex-1 flex flex-col items-center justify-center">
                    <TempControl
                        temperature={localTemp}
                        isOn={isOn}
                        onStateChange={handleStateChange}
                    />
                </GlassCard>
            </div>

            {/* 风速选择器 */}
            <FanSpeedSelector
                fanSpeed={fanSpeed}
                isSwingOn={isSwingOn}
                onStateChange={handleStateChange}
            />
        </div>
    );
};

export default ACControlPanel;
import React from 'react';
import { Power } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

const TempControl = ({ temperature, isOn, onStateChange }) => {
    // 防抖定时器
    const timeoutRef = useRef(null);
    // 记录最后一次服务器温度，用于判断是否需要更新本地温度
    const lastServerTemp = useRef(temperature);
    // 记录最后一次发送到服务器的温度
    const lastSentTemp = useRef(temperature);
    // 标记是否正在等待服务器响应
    const isPendingRef = useRef(false);

    // 添加滚轮累积值的 ref
    const wheelDeltaAccumulator = useRef(0);
    // 设置灵敏度阈值（数值越大灵敏度越低）
    const sensitivityThreshold = 50;

    // 当服务器温度更新时，检查是否需要更新本地温度
    useEffect(() => {
        if (!isPendingRef.current && temperature !== lastServerTemp.current) {
            lastServerTemp.current = temperature;
            lastSentTemp.current = temperature;
        }
    }, [temperature]);

    const angle = (temperature - 16) * (300 / (30 - 16));

    const handleWheel = (e) => {
        if (!isOn) return;
        e.preventDefault();
        
        // 累积滚轮值
        wheelDeltaAccumulator.current += Math.abs(e.deltaY);
        
        // 如果累积值未达到阈值，不触发温度变化
        if (wheelDeltaAccumulator.current < sensitivityThreshold) {
            return;
        }
        
        // 达到阈值后重置累积值
        wheelDeltaAccumulator.current = 0;
        
        const newTemp = Math.min(30, Math.max(16, temperature - Math.sign(e.deltaY)));
        
        // 立即通知父组件更新本地温度
        onStateChange({ temperature: newTemp, immediate: true });

        // 清除之前的定时器
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // 设置新的定时器，1秒后发送到服务器
        timeoutRef.current = setTimeout(() => {
            isPendingRef.current = true;
            lastSentTemp.current = newTemp;
            onStateChange({ temperature: newTemp });
        }, 1000);
    };

    // 组件卸载时清理定时器
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handlePowerClick = () => {
        // 如果有待发送的温度变化，先发送温度变化
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            isPendingRef.current = true;
            lastSentTemp.current = temperature;
            onStateChange({ temperature: temperature, isOn: !isOn });
        } else {
            onStateChange({ isOn: !isOn });
        }
    };

    return (
        <>
            <div
                className="relative w-40 h-40"
                onWheel={handleWheel}
                onClick={handlePowerClick}
            >
                <div
                    className={`absolute inset-2 rounded-full bg-white shadow-lg cursor-pointer
                        ${isOn ? 'bg-opacity-30' : 'bg-opacity-10'}`}
                    style={{
                        transform: `rotate(${angle}deg)`,
                        transition: 'transform 0.3s ease-out, background-color 0.3s ease-out, opacity 0.3s ease-out'
                    }}
                >
                    <div className="absolute inset-0 rounded-full shadow-inner"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Power
                        className={`w-16 h-16 transition-opacity duration-300 
                            ${isOn ? 'text-white opacity-100' : 'text-red-400 opacity-80'}`}
                    />
                </div>
            </div>
            <p className="mt-2 text-xs text-white text-opacity-80">
                {isOn ? '滑动调节温度，点击关闭空调' : '点击开启空调'}
            </p>
        </>
    );
};

export default TempControl;
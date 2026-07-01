// pages/ACController.jsx
import { 
    getAirConditionerStatus, 
    controlAirConditioner
} from '@/services/API';
import { useState, useEffect, useMemo } from 'react';
import AIAssistant from '@components/ac_controller/AIAssistant';
import ScheduledTasks from '@components/ac_controller/ScheduledTasks';
import LifeSuggestions from '@components/ac_controller/LifeSuggestions';
import UsageRecord from '@components/ac_controller/UsageRecord';
import ACControlPanel from '@components/ac_controller/ACControlPanel';
import useACBackground from '@hooks/useACBackground';
import { useWeather, WeatherProvider } from "@/contexts/WeatherContext";
import { TaskProvider, useTasks } from '@contexts/TaskContext';

const ACControllerContent = ({ 
    roomId, 
    temperature, setTemperature,
    isOn, setIsOn,
    mode, setMode,
    fanSpeed, setFanSpeed,
    isSweepOn, setIsSweepOn,
    roomTemperature, setRoomTemperature,
    cost, setCost,
    totalMoney, setTotalMoney,
    moneyData, setMoneyData,
    onAdjustAC 
}) => {
    // 状态定义
    const [bgStyle, setBgStyle] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const maxDataPoints = 30; // 设置最大数据点数量

    // 使用自定义hooks
    useACBackground(mode, isOn, setBgStyle);

    // 初始化获取空调状态和维护能耗数据
    useEffect(() => {
        const fetchACStatus = async () => {
            try {
                const response = await getAirConditionerStatus(roomId);
                if (response.code === 0 && response.data) {
                    const { data } = response;
                    
                    // 更新空调状态
                    setTemperature(data.temperature);
                    setMode(data.mode);
                    setIsOn(data.power === 'on');
                    setFanSpeed(data.windSpeed);
                    setIsSweepOn(data.sweep === '开');
                    setRoomTemperature(data.roomTemperature);
                    setCost(data.cost);
                    setTotalMoney(data.totalMoney);

                    // 更新能耗数据
                    setMoneyData(prevData => {
                        const currentTime = new Date().toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            second: '2-digit'
                        });
                        
                        const newDataPoint = {
                            time: currentTime,
                            energy: data.cost,
                            totalMoney: data.totalMoney,
                            status: data.power,
                            temperature: data.temperature,
                            windSpeed: data.windSpeed
                        };

                        // 保持最新的30个数据点
                        const updatedData = [...prevData, newDataPoint]
                            .slice(-maxDataPoints);

                        return updatedData;
                    });

                    // 首次加载后关闭loading状态
                    setLoading(false);
                }
            } catch (error) {
                setError(error.message);
                console.error('获取空调状态失败:', error);
            }
        };

        // 首次加载
        fetchACStatus();
        
        // 设置5秒定时刷新
        const interval = setInterval(fetchACStatus, 1000);
        
        return () => clearInterval(interval);
    }, [roomId]);

    // UsageRecord组件所需的统计数据计算
    const calculatedStats = useMemo(() => {
        if (moneyData.length === 0) return null;

        // 计算平均能耗
        const avgEnergy = moneyData.reduce((acc, item) => acc + item.energy, 0) / moneyData.length;

        // 找出能耗峰值
        const peakEnergy = Math.max(...moneyData.map(item => item.energy));

        // 计算开机时间比例
        const runningCount = moneyData.filter(item => item.status === 'on').length;
        const runningRatio = (runningCount / moneyData.length) * 100;

        return {
            avgEnergy: avgEnergy.toFixed(2),
            peakEnergy: peakEnergy.toFixed(2),
            runningRatio: runningRatio.toFixed(1)
        };
    }, [moneyData]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen">加载中...</div>;
    }

    if (error) {
        return <div className="flex items-center justify-center h-screen text-red-500">错误: {error}</div>;
    }

    return (
        <div className="flex items-center justify-center w-screen h-screen bg-gray-100">
            <div className="w-[90%] h-[90%] p-8 rounded-3xl shadow-2xl relative overflow-hidden transition-all duration-500"
                 style={bgStyle}>
                <div className="absolute inset-0 backdrop-blur-md bg-black bg-opacity-10"></div>

                <div className="relative z-10 flex w-full h-full gap-6">
                    {/* 左侧：生活建议模块 */}
                    <div className="flex-1 flex flex-col gap-6">
                        <LifeSuggestions
                            roomTemperature={roomTemperature}
                        />
                    </div>

                    {/* 中间：空调控制部分 */}
                    <div className="flex-1 flex flex-col gap-6">
                    <ACControlPanel
                        roomId={roomId}
                        temperature={temperature}
                        setTemperature={setTemperature}
                        mode={mode}
                        setMode={setMode}
                        isOn={isOn}
                        setIsOn={setIsOn}
                        fanSpeed={fanSpeed}
                        setFanSpeed={setFanSpeed}
                        isSwingOn={isSweepOn}
                        setIsSwingOn={setIsSweepOn}
                        onAdjust={onAdjustAC}
                        roomTemperature={roomTemperature}
                    />

                        {/* 能耗记录卡片 */}
                        <UsageRecord
                            moneyData={moneyData}
                            totalMoney={totalMoney}
                            currentCost={cost}
                            stats={calculatedStats}
                        />
                    </div>

                    {/* 右侧：AI助手和定时任务 */}
                    <div className="flex-1 flex flex-col gap-6">
                        <div className="flex-1 min-h-0">
                            <AIAssistantWrapper
                                currentACState={{
                                    temperature,
                                    roomTemperature,
                                    mode,
                                    windSpeed: fanSpeed,
                                    sweep: isSweepOn ? '开' : '关',
                                    power: isOn ? 'on' : 'off'
                                }}
                                onAdjustAC={onAdjustAC}
                            />
                        </div>
                        <div className="flex-1 min-h-0">
                            <ScheduledTasks 
                                onTaskExecute={onAdjustAC}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AIAssistantWrapper = ({ currentACState, onAdjustAC }) => {
    const { tasks, addTask, deleteTask } = useTasks();
    const { weatherSuggestion } = useWeather();

    const handleScheduleTask = (taskSettings) => {
        try {
            addTask(taskSettings);
        } catch (error) {
            console.error('Error scheduling task:', error);
        }
    };

    const handleDeleteTask = (index) => {
        try {
            deleteTask(index);
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    return (
        <AIAssistant
            currentACState={currentACState}
            lifeSuggestions={weatherSuggestion}
            scheduledTasks={tasks}
            onAdjustAC={onAdjustAC}
            onScheduleTask={handleScheduleTask}
            onDeleteTask={handleDeleteTask}
        />
    );
};

const ACController = ({ roomId }) => {
    const [temperature, setTemperature] = useState(25);
    const [isOn, setIsOn] = useState(false);
    const [mode, setMode] = useState('制冷');
    const [fanSpeed, setFanSpeed] = useState('中速');
    const [isSweepOn, setIsSweepOn] = useState(true);
    const [roomTemperature, setRoomTemperature] = useState(26);
    const [cost, setCost] = useState(0);
    const [totalMoney, setTotalMoney] = useState(0);
    const [moneyData, setMoneyData] = useState([]);

    // 处理空调调节的函数
    const handleAdjustAC = async (settings) => {
        try {
            // 确保所有必需参数都存在且格式正确
            const apiParams = {
                roomId,
                power: settings.power || (isOn ? 'on' : 'off'),  // 确保有默认值
                temperature: settings.temperature || temperature,  // 确保有默认值
                windSpeed: settings.windSpeed || fanSpeed,        // 确保有默认值
                sweep: settings.sweep || (isSweepOn ? '开' : '关')  // 确保有默认值
            };

            // 调用 API 更新后端状态
            await controlAirConditioner(apiParams);

            // 更新前端状态
            if (settings.temperature !== undefined) {
                setTemperature(settings.temperature);
            }
            if (settings.power !== undefined) {
                setIsOn(settings.power === 'on');
            }
            if (settings.windSpeed !== undefined) {
                setFanSpeed(settings.windSpeed);
            }
            if (settings.sweep !== undefined) {
                setIsSweepOn(settings.sweep === '开');
            }
        } catch (error) {
            console.error('Failed to adjust AC:', error);
            // 可以添加错误提示
        }
    };

    return (
        <WeatherProvider>
            <TaskProvider onTaskExecute={handleAdjustAC}>
                <ACControllerContent 
                    roomId={roomId}
                    temperature={temperature}
                    setTemperature={setTemperature}
                    isOn={isOn}
                    setIsOn={setIsOn}
                    mode={mode}
                    setMode={setMode}
                    fanSpeed={fanSpeed}
                    setFanSpeed={setFanSpeed}
                    isSweepOn={isSweepOn}
                    setIsSweepOn={setIsSweepOn}
                    roomTemperature={roomTemperature}
                    setRoomTemperature={setRoomTemperature}
                    cost={cost}
                    setCost={setCost}
                    totalMoney={totalMoney}
                    setTotalMoney={setTotalMoney}
                    moneyData={moneyData}
                    setMoneyData={setMoneyData}
                    onAdjustAC={handleAdjustAC}
                />
            </TaskProvider>
        </WeatherProvider>
    );
};

export default ACController;
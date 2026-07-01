import React, { useEffect, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getACOperationRecords } from '@/services/API';

const EnergyConsumptionChart = ({ rooms }) => {
    const [energyData, setEnergyData] = useState([]);
    const [totalConsumption, setTotalConsumption] = useState(0);

    useEffect(() => {
        const fetchACOperationData = async () => {
            try {
                const data = await getACOperationRecords();
                if (data.code === 0 && Array.isArray(data.data)) {
                    // 按时间排序
                    const sortedData = data.data.sort((a, b) => new Date(a.time) - new Date(b.time));
                    
                    // 创建最近6小时的时间点数据
                    const now = new Date();
                    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
                    const timePoints = [];
                    
                    // 每30分钟一个数据点
                    for (let time = sixHoursAgo; time <= now; time = new Date(time.getTime() + 30 * 60 * 1000)) {
                        // 找出该时间点之前的所有记录
                        const relevantRecords = sortedData.filter(record => 
                            new Date(record.time) <= time && 
                            new Date(record.time) > new Date(time.getTime() - 30 * 60 * 1000)
                        );
                        
                        // 计算该时间段的总能耗
                        const periodEnergy = relevantRecords.reduce((sum, record) => 
                            sum + (record.energyCost || 0), 0);
                        
                        timePoints.push({
                            time: time.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            }),
                            energy: periodEnergy
                        });
                    }

                    setEnergyData(timePoints);
                }
            } catch (error) {
                console.error('获取空调操作记录失败:', error);
            }
        };

        fetchACOperationData();
        const interval = setInterval(fetchACOperationData, 60 * 1000); // 每分钟更新一次
        return () => clearInterval(interval);
    }, []);

    // 从父组件更新总能耗
    useEffect(() => {
        if (Array.isArray(rooms)) {
            const totalCost = rooms.reduce((sum, room) => sum + (room.totalCost || 0), 0);
            setTotalConsumption(totalCost);
        }
    }, [rooms]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-white">空调电力用量</h3>
                <div className="text-right">
                    <div>
                        <p className="text-sm text-white text-opacity-80">总能耗</p>
                        <p className="text-xl font-bold text-white">{totalConsumption.toFixed(2)} KWH</p>
                    </div>
                </div>
            </div>
            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={energyData}>
                        <XAxis
                            dataKey="time"
                            stroke="#ffffff80"
                            interval={2}
                            angle={-45}
                            textAnchor="end"
                            height={50}
                        />
                        <YAxis
                            stroke="#ffffff80"
                            tickFormatter={(value) => value.toFixed(2)}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                border: 'none'
                            }}
                            labelStyle={{color: '#fff'}}
                            itemStyle={{color: '#fff'}}
                            formatter={(value) => [`${value.toFixed(2)} KWH`, "能耗"]}
                            labelFormatter={(label) => `时间: ${label}`}
                        />
                        <Line
                            type="monotone"
                            dataKey="energy"
                            stroke="#8884d8"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default EnergyConsumptionChart;
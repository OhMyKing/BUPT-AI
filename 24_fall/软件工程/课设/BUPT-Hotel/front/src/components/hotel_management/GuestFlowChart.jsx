import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import _ from 'lodash';

const GuestFlowChart = ({ guestFlowData }) => {
    const chartData = useMemo(() => {
        if (!guestFlowData || guestFlowData.length === 0) return [];

        // 按时间排序
        const sortedRecords = _.sortBy(guestFlowData, record => new Date(record.time).getTime());

        // 计算每个时间点的累计入住人数
        let currentOccupancy = 0;
        return sortedRecords.map(record => {
            currentOccupancy += (record.operation === "入住" ? 1 : -1);
            // 使用moment或直接处理UTC时间
            const utcDate = new Date(record.time);
            const localDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000); // 转换为本地时间
            
            return {
                time: `${localDate.getMonth() + 1}月${localDate.getDate()}日 ${String(localDate.getHours()).padStart(2, '0')}:${String(localDate.getMinutes()).padStart(2, '0')}`,
                rawTime: localDate,
                occupancy: currentOccupancy
            };
        });
    }, [guestFlowData]);

    if (!guestFlowData || guestFlowData.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-white">近一周客流量变化</h3>
            </div>
            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                        <XAxis
                            dataKey="time"
                            stroke="#ffffff80"
                            interval={Math.ceil(chartData.length / 5)}
                            angle={-45}
                            textAnchor="end"
                            tick={{ fontSize: 10 }} 
                            height={60}
                        />
                        <YAxis
                            stroke="#ffffff80"
                            tickFormatter={(value) => Math.round(value)}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                border: 'none'
                            }}
                            labelStyle={{color: '#fff'}}
                            itemStyle={{color: '#fff'}}
                            formatter={(value) => [`${value} 人`, "人数变化"]}
                            labelFormatter={(label) => `时间: ${label}`}
                        />
                        <Line
                            type="basis" 
                            dataKey="occupancy"
                            stroke="#8884d8"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                            name="入住人数"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default GuestFlowChart;
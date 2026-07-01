import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import GlassCard from '@components/layout/GlassCard';

const UsageRecord = ({ moneyData, totalMoney }) => {
    console.log(moneyData);
    // 自定义tick，只在整点显示时间
    const CustomXAxisTick = ({ x, y, payload }) => {
        // 如果是整点，显示时间
        if (payload.value.endsWith(':00')) {
            return (
                <g transform={`translate(${x},${y})`}>
                    <text
                        x={0}
                        y={0}
                        dy={16}
                        textAnchor="middle"
                        fill="#ffffff80"
                    >
                        {payload.value}
                    </text>
                </g>
            );
        }
        return null; // 非整点不显示
    };

    return (
        <GlassCard className="flex-1 flex flex-col py-5">
            {/* 头部信息区域 - 使用固定高度 */}
            <div className="h-16 flex justify-between items-start px-4">
                <h3 className="text-lg font-medium text-white">总消费变化</h3>
                <div className="text-right">
                    <p className="text-sm text-white text-opacity-80">总价格</p>
                    <p className="text-xl font-bold text-white">￥{totalMoney}</p>
                </div>
            </div>

            {/* 图表区域 - 使用剩余空间但限制最大高度 */}
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={moneyData}
                        margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
                    >
                        <XAxis
                            dataKey="time"
                            stroke="#ffffff80"
                            height={50}
                            tick={<CustomXAxisTick />}
                            interval={0}  // 显示所有tick，但通过CustomXAxisTick控制显示
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
                            labelStyle={{ color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value) => [value.toFixed(2) + " 元", "总消费"]}
                            labelFormatter={(label) => `时间: ${label}`}
                        />
                        <Line
                            type="monotone"
                            dataKey="totalMoney"
                            stroke="#8884d8"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
};

export default UsageRecord;
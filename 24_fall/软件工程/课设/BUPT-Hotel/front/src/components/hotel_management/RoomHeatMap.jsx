import { useMemo } from 'react';
import { Tooltip } from 'react-tooltip';
import { interpolateRgb } from 'd3-interpolate';
import { scaleLinear } from 'd3-scale';

const RoomHeatMap = ({ rooms, mode = 'default' }) => {
    const cols = Math.ceil(Math.sqrt(rooms.length));

    // 计算所有房间的功率范围
    const { minConsumption, maxConsumption } = useMemo(() => {
        const consumptions = rooms.map(room => room.consumption);
        return {
            minConsumption: Math.min(...consumptions),
            maxConsumption: Math.max(...consumptions)
        };
    }, [rooms]);

    // 计算值和获取提示文本
    const { getValue, getTooltip } = useMemo(() => {
        const configs = {
            receptionist: {
                getValue: room => room.customerCount,
                getTooltip: room => `房间号: ${room.number}
入住人数: ${room.customerCount}人
状态: ${room.customerCount > 0 ? '已入住' : '空闲'}`
            },
            ac_admin: {
                getValue: room => room.consumption,
                getTooltip: room => `房间号: ${room.number}
调度状态: ${room.dispatch ? '保障' : '等待'}
能耗: ${room.consumption.toFixed(2)} kWh`
            },
            manager: {
                getValue: room => room.consumption,
                getTooltip: room => `房间号: ${room.number}
能耗: ${room.consumption.toFixed(2)} kWh
状态: ${room.occupied ? '占用' : '空闲'}`
            }
        };

        return configs[mode] || configs.manager;
    }, [mode]);

    // 创建颜色比例尺
    const colorScale = useMemo(() => {
        if (mode === 'receptionist') {
            const interpolator = interpolateRgb("#E3F2FD", "#2196F3");
            return scaleLinear()
                .domain([0, 2])  // 固定范围为0-2人
                .range([0, 1])
                .interpolate((a, b) => t => interpolator(t));
        } else {
            const interpolator = interpolateRgb("#E3F2FD", "#2196F3");
            return scaleLinear()
                .domain([minConsumption, maxConsumption])  // 使用全局功率范围
                .range([0, 1])
                .interpolate((a, b) => t => interpolator(t));
        }
    }, [mode, minConsumption, maxConsumption]);

    const tooltipStyles = {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        color: '#1e3a8a',
        border: 'none',
        borderRadius: '0.5rem',
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    };

    return (
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {rooms.map((room) => {
                const value = getValue(room);
                const backgroundColor = mode === 'receptionist' && value === 0
                    ? '#f3f4f6'  // 如果是前台模式且房间空闲，显示灰色
                    : colorScale(value);

                return (
                    <div
                        key={room.number}
                        className="aspect-square rounded-sm cursor-pointer transition-all duration-300 hover:scale-105"
                        style={{ backgroundColor }}
                        data-tooltip-id={`room-tooltip-${room.number}`}
                        data-tooltip-content={getTooltip(room)}
                    >
                        <Tooltip
                            id={`room-tooltip-${room.number}`}
                            place="top"
                            className="custom-tooltip"
                            style={tooltipStyles}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default RoomHeatMap;
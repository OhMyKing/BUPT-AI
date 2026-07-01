import React, { useMemo, useEffect, useState } from 'react';
import { Power, Clock, Loader2 } from 'lucide-react';
import { getScheduleRecords } from '@/services/API';

const ACRecordsList = () => {
    const [scheduleData, setScheduleData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchScheduleData = async () => {
            try {
                const response = await getScheduleRecords();
                setScheduleData(response.data);
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        };

        fetchScheduleData();
        const interval = setInterval(fetchScheduleData, 30000);
        return () => clearInterval(interval);
    }, []);

    const currentSchedule = useMemo(() => {
        if (!scheduleData?.length) return null;
        
        // 由于数据已经按时间排序，直接取第一条
        const latestRecord = scheduleData[0];
        
        try {
            return {
                time: latestRecord.time,
                runningQueue: JSON.parse(latestRecord.running_queue || '[]'),
                waitingQueue: JSON.parse(latestRecord.waiting_queue || '[]')
            };
        } catch (e) {
            console.error('解析队列数据失败:', e);
            return {
                time: latestRecord.time,
                runningQueue: [],
                waitingQueue: []
            };
        }
    }, [scheduleData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 text-center">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">空调调度状态</h3>
                {currentSchedule && (
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">
                            调度发生时间: {
                                new Date(currentSchedule.time).toLocaleString('zh-CN', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: false
                                })
                            }
                        </span>
                    </div>
                )}
            </div>
            {currentSchedule && (
                <div>
                    {/* 运行队列 */}
                    <div className="mb-3">
                        <h4 className="text-sm font-medium mb-2">正在保障</h4>
                        <div className="flex flex-wrap gap-2">
                            {currentSchedule.runningQueue?.length > 0 ? (
                                currentSchedule.runningQueue.map((roomId) => (
                                    <div key={roomId} className="px-3 py-1 bg-green-500 bg-opacity-20 rounded-full flex items-center gap-1">
                                        <Power className="h-3 w-3" />
                                        <span className="text-sm">{roomId}</span>
                                    </div>
                                ))
                            ) : (
                                <span className="text-sm text-gray-400">无</span>
                            )}
                        </div>
                    </div>

                    {/* 等待队列 */}
                    <div>
                        <h4 className="text-sm font-medium mb-2">等待队列</h4>
                        <div className="flex flex-wrap gap-2">
                            {currentSchedule.waitingQueue?.length > 0 ? (
                                currentSchedule.waitingQueue.map((roomId) => (
                                    <div key={roomId} className="px-3 py-1 bg-yellow-500 bg-opacity-20 rounded-full flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span className="text-sm">{roomId}</span>
                                    </div>
                                ))
                            ) : (
                                <span className="text-sm text-gray-400">无</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ACRecordsList;
import {useState, useEffect} from 'react';
import {BarChart, FileText, Search} from 'lucide-react';
import GlassCard from "@layout/GlassCard.jsx";
import {Input} from "@ui/input.jsx";
import {Button} from "@ui/button.jsx";
import {Dialog} from "@ui/dialog.jsx";
import {Toast} from "@ui/toast.jsx";
import { getHotelRoomsOverview, getAllRoomsACStatus, getACOperationRecords, getWeeklyGuestFlow, getScheduleRecords } from '@/services/API';
import { reportStyles } from '@/constants/reportStyles';


const HotelManagement = () => {
    const [rooms, setRooms] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState(null);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [currentReport, setCurrentReport] = useState(null);
    const [isHotelReportOpen, setIsHotelReportOpen] = useState(false);
    const [hotelReport, setHotelReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scheduleData, setScheduleData] = useState([]);
    const [guestFlowData, setGuestFlowData] = useState([]);
    const [acOperationRecords, setAcOperationRecords] = useState([]);
    const formatTime = (timeStr) => {
        return new Date(timeStr).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 添加数据获取逻辑
    useEffect(() => {
        const fetchRoomsData = async () => {
            try {
                // 获取所有需要的数据
                const [roomsResponse, acStatusResponse, scheduleResponse, guestFlowResponse, acOperationResponse] = await Promise.all([
                    getHotelRoomsOverview(),
                    getAllRoomsACStatus(),
                    getScheduleRecords(),
                    getWeeklyGuestFlow(),
                    getACOperationRecords()
                ]);

                if (roomsResponse.code === 0 && acStatusResponse.code === 0) {
                    // 合并房间信息和空调状态
                    const formattedRooms = roomsResponse.data.map(room => ({
                        id: room.roomId.toString(),
                        type: room.roomLevel,
                        customers: room.people.map(person => ({
                            id: person.peopleId,
                            name: person.peopleName
                        })),
                        energyConsumption: room.cost,
                        // 添加空调相关信息
                        ac_records: acStatusResponse.data
                            .filter(ac => ac.roomId === room.roomId)
                            .map(ac => ({
                                time: ac.time,
                                power: ac.power === 'on',
                                energyConsumption: ac.energyCost,
                                temperature: ac.temperature,
                                windSpeed: ac.windSpeed,
                                mode: ac.mode,
                                sweep: ac.sweep === '开',
                                status: ac.status
                            }))
                    }));
                    setRooms(formattedRooms);
                }

                // 保存调度记录和客流记录
                if (scheduleResponse.code === 0) {
                    setScheduleData(scheduleResponse.data);
                }
                if (guestFlowResponse.code === 0) {
                    setGuestFlowData(guestFlowResponse.data);
                }

                // 保存空调操作记录
                if (acOperationResponse.code === 0) {
                    setAcOperationRecords(acOperationResponse.data);
                }
            } catch (error) {
                setToast({
                    type: 'error',
                    message: '获取数据失败：' + error.message
                });
            } finally {
                setLoading(false);
            }
        };

        fetchRoomsData();
        // 设置定时刷新
        const interval = setInterval(fetchRoomsData, 30000);
        return () => clearInterval(interval);
    }, []);

    const generateRoomReport = (room) => {
        // 使用从 getACOperationRecords 获取的空调操作记录并按时间降序排序
        const roomACRecords = acOperationRecords
            .filter(record => record.roomId.toString() === room.id)
            .sort((a, b) => new Date(b.time) - new Date(a.time));
        
        // 过滤出当前房间的客流记录
        const roomGuestFlow = guestFlowData
            .filter(record => record.roomId.toString() === room.id)
            .sort((a, b) => new Date(b.time) - new Date(a.time));
    
        // 添加数据格式化辅助函数
        const formatWindSpeed = (speed) => {
            const speedMap = {
                'low': '低速',
                'medium': '中速',
                'high': '高速',
                '低': '低速',
                '中': '中速',
                '高': '高速'
            };
            return speedMap[speed] || speed || '未设置';
        };
    
        const formatMode = (mode) => {
            const modeMap = {
                '0': '制冷',
                '1': '制热',
                'cold': '制冷',
                'hot': '制热',
                '制冷': '制冷',
                '制热': '制热'
            };
            return modeMap[mode] || mode || '未设置';
        };
    
        const formatSweep = (sweep) => {
            if (typeof sweep === 'boolean') {
                return sweep ? '开启' : '关闭';
            }
            if (sweep === '开' || sweep === 'on' || sweep === true) return '开启';
            if (sweep === '关' || sweep === 'off' || sweep === false) return '关闭';
            return sweep || '未设置';
        };
    
        const formatTime = (timeStr) => {
            if (!timeStr) return '时间未记录';
            const date = new Date(timeStr);
            if (isNaN(date.getTime())) return '无效时间';
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        };
    
        const report = `
            <div class="report-container">
                <h1>房间详细报告</h1>
                
                <section class="report-section">
                    <h2>🏠 基本信息</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">房间号：</span>
                            <span class="value">${room.id}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">房型：</span>
                            <span class="value">${room.type}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">能耗：</span>
                            <span class="value">${room.energyConsumption} KWH</span>
                        </div>
                    </div>
                </section>
    
                <section class="report-section">
                    <h2>👥 住客信息</h2>
                    <div class="info-grid">
                        ${room.customers.map(customer => `
                            <div class="info-item">
                                <span class="label">姓名：</span>
                                <span class="value">${customer.name}</span>
                            </div>
                        `).join('') || '<div class="info-item">当前无住客</div>'}
                    </div>
                </section>
    
                <section class="report-section">
                    <h2>❄️ 空调操作记录</h2>
                    <div class="record-list">
                        ${roomACRecords.length > 0 ? roomACRecords.map(record => `
                            <div class="room-card">
                                <div class="room-header">
                                    <span class="time">${formatTime(record.time)}</span>
                                    <span class="status-badge ${record.power === 'on' ? 'status-occupied' : 'status-vacant'}">
                                        ${record.power === 'on' ? '运行中' : '已关闭'}
                                    </span>
                                </div>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <span class="label">能耗：</span>
                                        <span class="value">${record.energyCost.toFixed(2)} KWH</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">费用：</span>
                                        <span class="value">¥${record.cost.toFixed(2)}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">温度：</span>
                                        <span class="value">${record.temperature}°C</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">风速：</span>
                                        <span class="value">${formatWindSpeed(record.windSpeed)}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">模式：</span>
                                        <span class="value">${formatMode(record.mode)}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">扫风：</span>
                                        <span class="value">${formatSweep(record.sweep)}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">状态：</span>
                                        <span class="value">${record.status}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">时间片：</span>
                                        <span class="value">${record.timeSlice}分钟</span>
                                    </div>
                                </div>
                            </div>
                        `).join('') : '<div class="info-item">暂无空调操作记录</div>'}
                    </div>
                </section>
    
                <section class="report-section">
                    <h2>👥 入住记录</h2>
                    <div class="record-list">
                        ${roomGuestFlow.length > 0 ? roomGuestFlow.map(record => `
                            <div class="room-card">
                                <div class="room-header">
                                    <span class="time">${formatTime(record.time)}</span>
                                    <span class="status-badge ${record.operation === '入住' ? 'status-occupied' : 'status-vacant'}">
                                        ${record.operation}
                                    </span>
                                </div>
                            </div>
                        `).join('') : '<div class="info-item">暂无入住记录</div>'}
                    </div>
                </section>
            </div>
        `;
        setCurrentReport(report);
        setIsReportOpen(true);
    };

    const generateHotelReport = () => {
        // 计算总能耗和平均能耗
        const totalEnergy = rooms.reduce((sum, room) => sum + room.energyConsumption, 0);
        const avgEnergy = rooms.length ? (totalEnergy / rooms.length).toFixed(2) : 0;

        // 计算入住率
        const occupiedRooms = rooms.filter(room => room.customers.length > 0).length;
        const occupancyRate = rooms.length ? ((occupiedRooms / rooms.length) * 100).toFixed(1) : 0;

        // 计算每种房型的数量和入住情况
        const roomTypes = {};
        rooms.forEach(room => {
            if (!roomTypes[room.type]) {
                roomTypes[room.type] = { total: 0, occupied: 0 };
            }
            roomTypes[room.type].total += 1;
            if (room.customers.length > 0) {
                roomTypes[room.type].occupied += 1;
            }
        });

        const report = `
            <div class="report-container">
                <h1>酒店总体报告</h1>
                
                <section class="report-section">
                    <h2>📊 总体统计</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">总房间数：</span>
                            <span class="value">${rooms.length}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">当前入住率：</span>
                            <span class="value highlight">${occupancyRate}%</span>
                        </div>
                        <div class="info-item">
                            <span class="label">已入住：</span>
                            <span class="value">${occupiedRooms}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">空房数：</span>
                            <span class="value">${rooms.length - occupiedRooms}</span>
                        </div>
                    </div>
                </section>

                <section class="report-section">
                    <h2>⚡ 能耗统计</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">总能耗：</span>
                            <span class="value">${Number(totalEnergy).toFixed(2)} KWH</span>
                        </div>
                        <div class="info-item">
                            <span class="label">平均能耗：</span>
                            <span class="value">${Number(avgEnergy).toFixed(2)} KWH</span>
                        </div>
                    </div>
                </section>

                <section class="report-section">
                    <h2>🏨 房间详情</h2>
                    ${rooms.map(room => `
                        <div class="room-card">
                            <div class="room-header">
                                <span class="value highlight">房间 ${room.id} (${room.type})</span>
                                <span class="status-badge ${room.customers.length > 0 ? 'status-occupied' : 'status-vacant'}">
                                    ${room.customers.length > 0 ? '已入住' : '空闲'}
                                </span>
                            </div>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="label">能耗：</span>
                                    <span class="value">${room.energyConsumption} KWH</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">住客：</span>
                                    <span class="value">${room.customers.map(c => c.name).join(', ') || '无'}</span>
                                </div>
                            </div>
                            ${(room.room_records || []).length > 0 ? `
                                <div class="record-list">
                                    <h3>最近记录：</h3>
                                    ${room.room_records.slice(-3).map(record => `
                                        <div class="record-item">
                                            ${formatTime(record.time)} - ${record.personName} ${record.actionType}
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </section>

                <section class="report-section">
                    <h2>🔄 空调调度记录</h2>
                    <div class="record-list">
                        ${scheduleData.length > 0 ? scheduleData.map(record => `
                            <div class="room-card">
                                <div class="room-header">
                                    <span class="time">${formatTime(record.time)}</span>
                                </div>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <span class="label">运行队列：</span>
                                        <span class="value">${JSON.parse(record.running_queue).join(', ') || '无'}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">等待队列：</span>
                                        <span class="value">${JSON.parse(record.waiting_queue).join(', ') || '无'}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('') : '<div class="info-item">暂无调度记录</div>'}
                    </div>
                </section>

                <section class="report-section">
                    <h2>👥 客流记录</h2>
                    <div class="record-list">
                        ${guestFlowData.map(record => `
                            <div class="room-card">
                                <div class="room-header">
                                    <span class="time">${formatTime(record.time)}</span>
                                    <span class="status-badge ${record.operation === '入住' ? 'status-occupied' : 'status-vacant'}">
                                        ${record.operation}
                                    </span>
                                </div>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <span class="label">房间号：</span>
                                        <span class="value">${record.roomId}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>

                <section class="report-section">
                    <h2>🔄 空调操作记录</h2>
                    <div class="record-list">
                        ${acOperationRecords.map(record => `
                            <div class="room-card">
                                <div class="room-header">
                                    <span class="time">${formatTime(record.time)}</span>
                                    <span class="status-badge ${record.power === 'on' ? 'status-occupied' : 'status-vacant'}">
                                        ${record.power === 'on' ? '开启' : '关闭'}
                                    </span>
                                </div>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <span class="label">房间号：</span>
                                        <span class="value">${record.roomId}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">温度：</span>
                                        <span class="value">${record.temperature}°C</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">风速：</span>
                                        <span class="value">${record.windSpeed}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">模式：</span>
                                        <span class="value">${record.mode}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">能耗：</span>
                                        <span class="value">${record.energyCost} KWH</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">费用：</span>
                                        <span class="value">¥${record.cost}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">状态：</span>
                                        <span class="value">${record.status}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('') || '<div class="info-item">暂无操作记录</div>'}
                    </div>
                </section>
            </div>
        `;
        setHotelReport(report);
        setIsHotelReportOpen(true);
    };

    const handlePrintReport = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>酒店报告</title>
                    <style>${reportStyles}</style>
                </head>
                <body>
                    ${isHotelReportOpen ? hotelReport : currentReport}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const filteredRooms = rooms.filter(room =>
        room.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.customers.some(customer =>
            customer.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div className="flex flex-col h-full">
            <GlassCard className="mb-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2 flex-grow mr-4">
                        <Search size={20}/>
                        <Input
                            placeholder="搜索房间号或客人姓名"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Button
                        onClick={generateHotelReport}
                        icon={BarChart}
                    >
                        酒店报表
                    </Button>
                </div>
            </GlassCard>

            <div className="flex-grow overflow-auto custom-scrollbar rounded-3xl">
                {filteredRooms.map(room => (
                    <GlassCard key={room.id} className="mb-4 p-6">
                        <div className="flex justify-between items-start">
                            {/* 左侧 - 基本信息 */}
                            <div className="w-2/3">
                                <h3 className="text-2xl font-semibold">房间: {room.id}</h3>
                                <p>房型: {room.type}</p>
                                <p>入住人数: {room.customers.length}</p>
                                <p>能耗: {room.energyConsumption}KWH</p>
                            </div>

                            {/* 右侧 - 操作按钮 */}
                            <div className="w-1/3 flex justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => generateRoomReport(room)}
                                    icon={FileText}
                                >
                                    房间报表
                                </Button>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            <Dialog
                open={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                title="房间报告"
                maxWidth="max-w-4xl"
            >
                <style>{reportStyles}</style>
                <div className="max-h-[70vh] overflow-y-auto custom-scrollbar-dark p-4">
                    <div dangerouslySetInnerHTML={{ __html: currentReport }} />
                </div>
                <div className="mt-4">
                    <Button onClick={handlePrintReport} className="w-full" icon={FileText}>
                        打印报告
                    </Button>
                </div>
            </Dialog>

            <Dialog
                open={isHotelReportOpen}
                onClose={() => setIsHotelReportOpen(false)}
                title="酒店总体报告"
                maxWidth="max-w-4xl"
            >
                <style>{reportStyles}</style>
                <div className="max-h-[70vh] overflow-y-auto custom-scrollbar-dark p-4">
                    <div dangerouslySetInnerHTML={{ __html: hotelReport }} />
                </div>
                <div className="mt-4">
                    <Button onClick={handlePrintReport} className="w-full" icon={FileText}>
                        打印报告
                    </Button>
                </div>
            </Dialog>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default HotelManagement;
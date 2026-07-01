import {useState, useEffect} from 'react';
import {FileText, Power, Save, Search, Tv} from 'lucide-react';
import GlassCard from "@layout/GlassCard.jsx";
import {Input} from "@ui/input.jsx";
import {Button} from "@ui/button.jsx";
import {Dialog} from "@ui/dialog.jsx";
import {Toast} from "@ui/toast.jsx";
import {getAllRoomsACStatus, adjustCentralAC, controlAirConditioner} from '@services/API';
import { reportStyles } from '@/constants/reportStyles';

const ACManagement = () => {
    const [rooms, setRooms] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState(null);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [currentReport, setCurrentReport] = useState(null);
    const [isRemoteControlOpen, setIsRemoteControlOpen] = useState(false);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [tempSettings, setTempSettings] = useState(null);
    const [isCentralACSettingOpen, setIsCentralACSettingOpen] = useState(false);
    const [centralACSettings, setCentralACSettings] = useState({
        mode: 0, // 0: 制冷, 1: 制热
        guaranteedRooms: 3, // 固定值
        fanRates: {
            lowSpeedRate: 0.5,
            midSpeedRate: 1.0,
            highSpeedRate: 2.0
        }
    });

    const FAN_SPEEDS = ['低', '中', '高'];
    const MODES = ['制冷', '制热'];

    const showToast = (message, type = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleCentralACSettingChange = (setting, value) => {
        if (setting === 'mode') {
            setCentralACSettings(prev => ({...prev, mode: value}));
        } else if (setting.includes('Rate')) {
            // 允许输入任何数值，包括小数
            setCentralACSettings(prev => ({
                ...prev,
                fanRates: {
                    ...prev.fanRates,
                    [setting]: value
                }
            }));
        }
    };

    const handleSaveCentralACSettings = async () => {
        try {
            // 在保存时验证费率
            const rates = Object.values(centralACSettings.fanRates);
            const invalidRates = rates.some(rate => isNaN(rate) || rate < 0);
            if (invalidRates) {
                showToast('费率必须为非负数');
                return;
            }

            await adjustCentralAC({
                mode: centralACSettings.mode,
                resourceLimit: 3, // 固定值
                fanRates: centralACSettings.fanRates
            });
            setIsCentralACSettingOpen(false);
            showToast('中央空调设置已更新', 'success');
            await fetchRoomsStatus();
        } catch (error) {
            showToast(error.message);
        }
    };

    const handleOpenRemoteControl = (room) => {
        setCurrentRoom(room);
        setTempSettings(room.acSettings);
        setIsRemoteControlOpen(true);
    };

    const handleACSettingChange = (setting, value) => {
        if (!tempSettings) return;

        // 如果是温度设置，需要转换为数字类型
        if (setting === 'temperature') {
            value = value === '' ? '' : parseInt(value);
        }

        setTempSettings({
            ...tempSettings,
            [setting]: value
        });
    };

    const handleSaveSettings = async () => {
        if (!currentRoom || !tempSettings) return;

        // 验证温度设置
        const temp = parseInt(tempSettings.temperature);
        if (isNaN(temp) || temp < 16 || temp > 30) {
            showToast('温度必须在16-30度之间');
            return;
        }

        try {
            const controlParams = {
                roomId: parseInt(currentRoom.id),
                power: tempSettings.power ? "on" : "off",
                temperature: temp,
                windSpeed: tempSettings.fanSpeed,
                sweep: tempSettings.swing ? "开" : "关"
            };

            await controlAirConditioner(controlParams);
            showToast('设置已更新', 'success');
            setIsRemoteControlOpen(false);
            await fetchRoomsStatus();
        } catch (error) {
            showToast(error.message);
        }
    };

    const handleGenerateReport = (room) => {
        const report = `
            <div class="report-container">
                <h1>房间状态报告</h1>
                
                <section class="report-section">
                    <h2>基本信息</h2>
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
                            <span class="label">总能耗：</span>
                            <span class="value">${room.energyConsumption} KWH</span>
                        </div>
                    </div>
                </section>

                <section class="report-section">
                    <h2>空调使用记录</h2>
                    <div class="records-list">
                        ${(room.ac_records || []).map(record => `
                            <div class="record-item">
                                <div class="record-header">
                                    <span class="time">${new Date(record.time).toLocaleString()}</span>
                                    <span class="status ${record.power === '运行中' ? 'running' : 'stopped'}">
                                        ${record.power}
                                    </span>
                                </div>
                                <div class="record-details">
                                    <div class="detail-item">
                                        <span class="label">能耗：</span>
                                        <span class="value">${record.energyConsumption} KWh</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="label">温度：</span>
                                        <span class="value">${record.temperature}°C</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="label">风速：</span>
                                        <span class="value">${record.windSpeed}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="label">模式：</span>
                                        <span class="value">${record.mode}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="label">扫风：</span>
                                        <span class="value">${record.sweep}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            </div>
        `;
        setCurrentReport(report);
        setIsReportOpen(true);
    };

    const handlePrintReport = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>房间报告</title>
                    <style>${reportStyles}</style>
                </head>
                <body>
                    ${currentReport}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const filteredRooms = rooms.filter(room =>
        room.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.customers.some(customer =>
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.idNumber.includes(searchTerm) ||
            customer.phone.includes(searchTerm)
        )
    );

    // 添加获取房型的辅助函数
    const getRoomType = (roomId) => {
        const id = parseInt(roomId);
        if (!id || id.toString().length !== 4) return '未知';
        
        const floor = Math.floor(id / 1000);
        const roomNum = id % 100;
        
        if (roomNum >= 1 && roomNum <= 10) {
            if (floor >= 2 && floor <= 4) {
                return '标准房';
            } else if (floor === 5) {
                return '大床房';
            }
        }
        return '未知';
    };

    // 修改获取所有房间空调状态的函数
    const fetchRoomsStatus = async () => {
        try {
            const response = await getAllRoomsACStatus();
            setRooms(response.data.map(room => ({
                id: room.roomId.toString(),
                type: getRoomType(room.roomId),
                acSettings: {
                    power: room.power === "on",
                    temperature: room.temperature,
                    fanSpeed: room.windSpeed,
                    mode: room.mode,
                    swing: room.sweep === "开",
                },
                energyConsumption: room.totalCost,
                currentCost: room.cost,
                timeSlice: room.timeSlice,
                roomTemperature: room.roomTemperature,
                customers: [],
                ac_records: [{
                    time: new Date().toISOString(),
                    energyConsumption: room.cost.toString(),
                    power: room.power === "on" ? "运行中" : "关闭",
                    temperature: room.temperature,
                    windSpeed: room.windSpeed,
                    mode: room.mode,
                    sweep: room.sweep
                }]
            })));
        } catch (error) {
            showToast(error.message);
        }
    };

    // 添加辅助函数来转换风速
    const getFanSpeedText = (speed) => {
        const speedMap = {
            0: '低',
            1: '中',
            2: '高'
        };
        return speedMap[speed] || '低';
    };

    // 添加辅助函数来转换模式
    const getModeText = (mode) => {
        const modeMap = {
            0: '制冷',
            1: '制热'
        };
        return modeMap[mode] || '制冷';
    };

    // 定期更新房间状态
    useEffect(() => {
        fetchRoomsStatus();
        const interval = setInterval(fetchRoomsStatus, 5000); // 每5秒更新一次
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col h-full">
            <GlassCard className="mb-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2 flex-grow mr-4">
                        <Search size={20}/>
                        <Input
                            placeholder="搜索房间号"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={() => setIsCentralACSettingOpen(true)}
                            icon={Power}
                        >
                            中央空调设置
                        </Button>
                    </div>
                </div>
            </GlassCard>

            <div className="flex-grow overflow-auto custom-scrollbar rounded-3xl">
                {filteredRooms.map(room => (
                    <GlassCard key={room.id} className="mb-4 p-6">
                        <div className="flex justify-between items-start">
                            {/* 左侧 - 基本信息 */}
                            <div className="w-1/3">
                                <h3 className="text-2xl font-semibold">房间: {room.id}</h3>
                                <p>房型: {room.type}</p>
                                <p>能耗: {room.energyConsumption}KWH</p>
                            </div>

                            {/* 中间 - 空调状态 */}
                            <div className="w-1/3">
                                <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                                    <div className="flex flex-col leading-tight">
                                        <span className="text-gray-500 text-xs">电源</span>
                                        <p className="text-sm">{room.acSettings.power ? '开启' : '关闭'}</p>
                                    </div>
                                    {room.acSettings.power && (
                                        <>
                                            <div className="flex flex-col leading-tight">
                                                <span className="text-gray-500 text-xs">温度</span>
                                                <p className="text-sm">{room.acSettings.temperature} ℃</p>
                                            </div>
                                            <div className="flex flex-col leading-tight">
                                                <span className="text-gray-500 text-xs">模式</span>
                                                <p className="text-sm">{room.acSettings.mode}</p>
                                            </div>
                                            <div className="flex flex-col leading-tight">
                                                <span className="text-gray-500 text-xs">风速</span>
                                                <p className="text-sm">{room.acSettings.fanSpeed}</p>
                                            </div>
                                            <div className="flex flex-col leading-tight">
                                                <span className="text-gray-500 text-xs">扫风</span>
                                                <p className="text-sm">{room.acSettings.swing ? '开启' : '关闭'}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* 右侧 - 操作按钮 */}
                            <div className="w-1/3 flex flex-col items-end space-y-2">
                                <Button
                                    variant="outline"
                                    onClick={() => handleOpenRemoteControl(room)}
                                    icon={Tv}
                                >
                                    远程控制
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleGenerateReport(room)}
                                    icon={FileText}
                                >
                                    空调记录
                                </Button>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            <Dialog
                open={isCentralACSettingOpen}
                onClose={() => setIsCentralACSettingOpen(false)}
                title="中央空调设置"
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            运行模式
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {MODES.map((mode, index) => (
                                <Button
                                    key={mode}
                                    variant={centralACSettings.mode === index ? "default" : "outline"}
                                    onClick={() => handleCentralACSettingChange('mode', index)}
                                    className="w-full"
                                >
                                    {mode}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">
                            风速费率设置 (元/度)
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                            {Object.entries(centralACSettings.fanRates).map(([key, value]) => (
                                <div key={key}>
                                    <label className="block text-xs text-gray-600 mb-1">
                                        {key === 'lowSpeedRate' ? '低速' : 
                                         key === 'midSpeedRate' ? '中速' : '高速'}
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={value}
                                        onChange={(e) => handleCentralACSettingChange(key, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button onClick={handleSaveCentralACSettings} className="w-full" icon={Save}>
                        保存设置
                    </Button>
                </div>
            </Dialog>

            <Dialog
                open={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                title="房间报告"
                maxWidth="max-w-2xl"
            >
                <style>{reportStyles}</style>
                <div className="max-h-96 overflow-y-auto custom-scrollbar-dark p-4">
                    <div dangerouslySetInnerHTML={{ __html: currentReport }} />
                </div>
                <div className="mt-4">
                    <Button onClick={handlePrintReport} className="w-full" icon={FileText}>
                        打印记录
                    </Button>
                </div>
            </Dialog>

            <Dialog
                open={isRemoteControlOpen}
                onClose={() => setIsRemoteControlOpen(false)}
                title={`房间 ${currentRoom?.id} 空调控制`}
            >
                {tempSettings && (
                    <div className="space-y-6 text-gray-800">
                        <div>
                            <label className="block text-sm font-medium mb-2">电源</label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={tempSettings.power ? "default" : "outline"}
                                    onClick={() => handleACSettingChange('power', true)}
                                >
                                    开启
                                </Button>
                                <Button
                                    variant={!tempSettings.power ? "default" : "outline"}
                                    onClick={() => handleACSettingChange('power', false)}
                                >
                                    关闭
                                </Button>
                            </div>
                        </div>

                        {tempSettings.power && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-2">温度设置 (16-30℃)</label>
                                    <Input
                                        type="number"
                                        min="16"
                                        max="30"
                                        value={tempSettings.temperature}
                                        onChange={(e) => handleACSettingChange('temperature', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">风速</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {FAN_SPEEDS.map((speed) => (
                                            <Button
                                                key={speed}
                                                variant={tempSettings.fanSpeed === speed ? "default" : "outline"}
                                                onClick={() => handleACSettingChange('fanSpeed', speed)}
                                            >
                                                {speed}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">扫风</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant={tempSettings.swing ? "default" : "outline"}
                                            onClick={() => handleACSettingChange('swing', true)}
                                        >
                                            开启
                                        </Button>
                                        <Button
                                            variant={!tempSettings.swing ? "default" : "outline"}
                                            onClick={() => handleACSettingChange('swing', false)}
                                        >
                                            关闭
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}

                        <Button onClick={handleSaveSettings} className="w-full" icon={Save}>
                            保存设置
                        </Button>
                    </div>
                )}
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

export default ACManagement;
import {useState, useEffect} from 'react';
import {FileText, LogOut, Printer, Search, UserCog, UserPlus} from 'lucide-react';
import GlassCard from "@layout/GlassCard.jsx";
import {Input} from "@ui/input.jsx";
import {Button} from "@ui/button.jsx";
import {Dialog} from "@ui/dialog.jsx";
import {Toast} from "@ui/toast.jsx";
import { getHotelRoomsOverview, checkIn, checkOut, getRoomReport } from '@/services/API';
import { reportStyles } from '@/constants/reportStyles';

const RoomManagement = () => {
    const [rooms, setRooms] = useState([]);
    const [isCheckInOpen, setIsCheckInOpen] = useState(false);
    const [isManageGuestsOpen, setIsManageGuestsOpen] = useState(false);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState(null);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [currentReport, setCurrentReport] = useState(null);
    const [checkInStep, setCheckInStep] = useState(1);
    const [selectedRoomForCheckIn, setSelectedRoomForCheckIn] = useState(null);
    const [newGuests, setNewGuests] = useState([{ name: '' }]);
    const [selectedType, setSelectedType] = useState(null);
    const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
    const [newGuestName, setNewGuestName] = useState('');
    const ROOM_RATES = {
        '2001': 100,
        '2002': 125,
        '2003': 150,
        '2004': 200,
        '2005': 100
    };

    const DEFAULT_ROOM_RATE = 100;

    const getRoomRate = (roomId) => {
        return ROOM_RATES[roomId] || DEFAULT_ROOM_RATE;
    };

    const showToast = (message, type = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // 获取房间列表
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await getHotelRoomsOverview();
                if (response.code === 0) {
                    const formattedRooms = response.data.map(room => ({
                        id: room.roomId.toString(),
                        type: room.roomLevel,
                        customers: room.people.map(person => ({
                            id: person.peopleId,
                            name: person.peopleName
                        })),
                        energyConsumption: room.cost,
                        checkInTime: room.checkInTime
                    }));
                    setRooms(formattedRooms);
                }
            } catch (error) {
                showToast(error.message);
            }
        };

        fetchRooms();
        // 设置定时刷新
        const interval = setInterval(fetchRooms, 30000);
        return () => clearInterval(interval);
    }, []);

    // 处理入住
    const handleCheckIn = async () => {
        if (!selectedRoomForCheckIn) {
            showToast('请选择房间');
            return;
        }

        const validGuests = newGuests.filter(guest => guest.name.trim());
        if (validGuests.length === 0) {
            showToast('请至少填写一位住客姓名');
            return;
        }

        try {
            // 逐个添加住客
            for (const guest of validGuests) {
                await checkIn(selectedRoomForCheckIn.id, guest.name);
            }
            
            // 刷新房间列表
            const response = await getHotelRoomsOverview();
            if (response.code === 0) {
                setRooms(response.data.map(room => ({
                    id: room.roomId.toString(),
                    type: room.roomLevel,
                    customers: room.people.map(person => ({
                        id: person.peopleId,
                        name: person.peopleName
                    })),
                    energyConsumption: room.cost,
                    checkInTime: room.checkInTime
                })));
            }

            setIsCheckInOpen(false);
            setCheckInStep(1);
            setSelectedRoomForCheckIn(null);
            setNewGuests([{ name: '' }]);
            showToast('入住办理成功', 'success');
        } catch (error) {
            showToast(error.message);
        }
    };

    // 处理退房
    const handleCheckOut = async () => {
        if (currentRoom) {
            try {
                await checkOut(currentRoom.id);
                
                // 刷新房间列表
                const response = await getHotelRoomsOverview();
                if (response.code === 0) {
                    setRooms(response.data.map(room => ({
                        id: room.roomId.toString(),
                        type: room.roomLevel,
                        customers: room.people.map(person => ({
                            id: person.peopleId,
                            name: person.peopleName
                        })),
                        energyConsumption: room.cost,
                        checkInTime: room.checkInTime
                    })));
                }

                setIsManageGuestsOpen(false);
                showToast('退房成功', 'success');
            } catch (error) {
                showToast(error.message);
            }
        }
    };

    const handleManageGuests = (room) => {
        setCurrentRoom(room);
        setIsManageGuestsOpen(true);
    };

    // 处理添加新住客
    const handleAddNewGuest = async () => {
        if (!newGuestName.trim()) {
            showToast('请输入住客姓名');
            return;
        }

        if (currentRoom && currentRoom.customers.length < 2) {
            try {
                // 调用入住API
                await checkIn(currentRoom.id, newGuestName.trim());
                
                // 刷新房间列表
                const response = await getHotelRoomsOverview();
                if (response.code === 0) {
                    const formattedRooms = response.data.map(room => ({
                        id: room.roomId.toString(),
                        type: room.roomLevel,
                        customers: room.people.map(person => ({
                            id: person.peopleId,
                            name: person.peopleName
                        })),
                        energyConsumption: room.cost,
                        checkInTime: room.checkInTime
                    }));
                    setRooms(formattedRooms);
                    
                    // 更新当前选中的房间信息
                    const updatedRoom = formattedRooms.find(room => room.id === currentRoom.id);
                    if (updatedRoom) {
                        setCurrentRoom(updatedRoom);
                    }
                }

                setNewGuestName('');
                setIsAddGuestOpen(false);
                showToast('添加住客成功', 'success');
            } catch (error) {
                showToast(error.message);
            }
        }
    };

    // 提取重复的数据格式化逻辑为一个函数
    const formatRoomsData = (data) => {
        return data.map(room => ({
            id: room.roomId.toString(),
            type: room.roomLevel,
            customers: room.people.map(person => ({
                id: person.peopleId,
                name: person.peopleName
            })),
            energyConsumption: room.cost,
            checkInTime: room.checkInTime
        }));
    };

    // 提取刷新房间数据的逻辑为一个函数
    const refreshRoomData = async () => {
        try {
            const response = await getHotelRoomsOverview();
            if (response.code === 0) {
                const formattedRooms = formatRoomsData(response.data);
                setRooms(formattedRooms);
                return formattedRooms;
            }
        } catch (error) {
            showToast(error.message);
        }
        return null;
    };

    const filteredRooms = rooms.filter(room =>
        room.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.customers.some(customer =>
            customer.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    // 生成报告
    const handleGenerateReport = async (room) => {
        if (room.customers.length === 0) {
            showToast('房间尚未入住，无法查看报告');
            return;
        }

        try {
            const response = await getRoomReport(room.id);
            if (response.code === 0) {
                // Calculate the duration of stay
                const checkInDate = new Date(response.checkInTime);
                const now = new Date();
                const daysStayed = Math.ceil((now - checkInDate) / (1000 * 60 * 60 * 24));

                // Calculate room charge
                const roomRate = getRoomRate(room.id);
                const roomCharge = roomRate * daysStayed;

                // Calculate total cost (room charge + AC usage)
                const totalCost = roomCharge + response.data.cost;

                const report = `
                <div class="report-container">
                    <h1>房间账单报告</h1>
                    
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
                                <span class="label">入住时间：</span>
                                <span class="value">${new Date(response.checkInTime).toLocaleString()}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">入住天数：</span>
                                <span class="value">${daysStayed}天</span>
                            </div>
                        </div>
                    </section>

                    <section class="report-section">
                        <h2>💰 费用明细</h2>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="label">房费（${roomRate}元/天）：</span>
                                <span class="value">${roomCharge.toFixed(2)} 元</span>
                            </div>
                            <div class="info-item">
                                <span class="label">空调费用：</span>
                                <span class="value">${response.data.cost.toFixed(2)} 元</span>
                            </div>
                            <div class="info-item highlight">
                                <span class="label">总费用：</span>
                                <span class="value">${totalCost.toFixed(2)} 元</span>
                            </div>
                        </div>
                    </section>

                    <section class="report-section">
                        <h2>👥 住客信息</h2>
                        <div class="info-grid">
                            ${response.data.people.map(person => `
                                <div class="info-item">
                                    <span class="label">姓名：</span>
                                    <span class="value">${person.peopleName}</span>
                                </div>
                            `).join('')}
                        </div>
                    </section>

                    <section class="report-section">
                        <h2>📝 空调使用记录</h2>
                        ${response.data.records.map(record => `
                            <div class="record-item">
                                <div class="record-header">
                                    <span class="time">${new Date(record.time).toLocaleString()}</span>
                                </div>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <span class="label">状态：</span>
                                        <span class="value">${record.power === 'on' ? '开启' : '关闭'}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">上段时间的能耗：</span>
                                        <span class="value">${record.cost} KWH</span>
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
                                        <span class="label">扫风：</span>
                                        <span class="value">${record.sweep}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </section>
                </div>
            `;

                setCurrentReport(report);
                setIsReportOpen(true);
            }
        } catch (error) {
            showToast(error.message);
        }
    };

    const handlePrintReport = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>房间账单报告</title>
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

    const handleAddGuest = () => {
        if (newGuests.length < 2) {
            setNewGuests([...newGuests, { name: '' }]);
        }
    };

    const handleGuestNameChange = (index, name) => {
        const updatedGuests = newGuests.map((guest, i) =>
            i === index ? { ...guest, name } : guest
        );
        setNewGuests(updatedGuests);
    };

    return (
        <div className="flex flex-col h-full">
            <GlassCard className="mb-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2 flex-grow mr-4">
                        <Search size={20}/>
                        <Input
                            placeholder="搜索房间号或顾客姓名"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Button onClick={() => {
                        setIsCheckInOpen(true);
                        setCheckInStep(1);
                        setSelectedRoomForCheckIn(null);
                        setNewGuests([{ name: '' }]);
                    }} icon={UserPlus}>
                        办理入住
                    </Button>
                </div>
            </GlassCard>

            <div className="flex-grow overflow-auto custom-scrollbar rounded-3xl">
                {filteredRooms.map(room => (
                    <GlassCard key={room.id} className="mb-4 flex justify-between items-start">
                        <div className="w-1/3">
                            <h3 className="text-2xl font-semibold">房间: {room.id}</h3>
                            <p>房型: {room.type}</p>
                            <p>入住人数: {room.customers.length}</p>
                        </div>
                        {/*<div className="w-1/3">*/}
                        {/*    <div className="grid grid-cols-2 gap-x-2">*/}
                        {/*        {room.customers.length > 0 ? (*/}
                        {/*            room.customers.map((customer, index) => (*/}
                        {/*                <div key={index} className="flex flex-col leading-tight">*/}
                        {/*                    <span className="text-gray-500 text-sm">住客 {index + 1}</span>*/}
                        {/*                    <p className="text-lg">{customer.name}</p>*/}
                        {/*                </div>*/}
                        {/*            ))*/}
                        {/*        ) : (*/}
                        {/*            <div className="flex flex-col leading-tight">*/}
                        {/*                <span className="text-gray-500 text-sm">状态</span>*/}
                        {/*                <p className="text-lg">空房</p>*/}
                        {/*            </div>*/}
                        {/*        )}*/}
                        {/*    </div>*/}
                        {/*</div>*/}
                        <div className="w-1/3 flex flex-col items-end space-y-2">
                            <Button
                                variant="outline"
                                onClick={() => handleManageGuests(room)}
                                icon={UserCog}
                            >
                                住客管理
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleGenerateReport(room)}
                                icon={FileText}
                            >
                                查看报告
                            </Button>
                        </div>
                    </GlassCard>
                ))}
            </div>

            <Dialog
                open={isCheckInOpen}
                onClose={() => {
                    setIsCheckInOpen(false);
                    setCheckInStep(1);
                    setSelectedRoomForCheckIn(null);
                    setNewGuests([{name: ''}]);
                    setSelectedType(null);
                }}
                title="办理入住"
            >
                {checkInStep === 1 ? (
                    <div>
                        <h3 className="text-lg font-medium mb-4 text-gray-900">选择房间</h3>
                        <div className="flex space-x-2 mb-4">
                            <Button
                                variant={!selectedType ? "default" : "outline"}
                                onClick={() => setSelectedType(null)}
                                className="flex-1 text-gray-900"
                            >
                                全部
                            </Button>
                            <Button
                                variant={selectedType === "大床房" ? "default" : "outline"}
                                onClick={() => setSelectedType("大床房")}
                                className="flex-1 text-gray-900"
                            >
                                大床房
                            </Button>
                            <Button
                                variant={selectedType === "标准间" ? "default" : "outline"}
                                onClick={() => setSelectedType("标准间")}
                                className="flex-1 text-gray-900"
                            >
                                标准间
                            </Button>
                        </div>
                        <div className="max-h-80 overflow-y-auto custom-scrollbar-dark">
                            {rooms.filter(room => room.customers.length === 0 && (!selectedType || room.type === selectedType)).map(room => (
                                <div
                                    key={room.id}
                                    className={`p-4 mb-2 rounded-lg cursor-pointer border ${
                                        selectedRoomForCheckIn?.id === room.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                    onClick={() => setSelectedRoomForCheckIn(room)}
                                >
                                    <p className="font-medium text-gray-900">房间号: {room.id}</p>
                                    <p className="text-sm text-gray-800">房型: {room.type}</p>
                                </div>
                            ))}
                        </div>
                        <Button
                            onClick={() => {
                                if (selectedRoomForCheckIn) {
                                    setCheckInStep(2);
                                } else {
                                    showToast('请选择房间');
                                }
                            }}
                            className="w-full mt-4"
                        >
                            下一步
                        </Button>
                    </div>
                ) : (
                    <div>
                        <h3 className="text-lg font-medium mb-4 text-gray-900">添加住客信息</h3>
                        <p className="text-sm text-gray-700 mb-4">请至少填写一位住客姓名，最多可添加两位住客</p>
                        {newGuests.map((guest, index) => (
                            <Input
                                key={index}
                                placeholder={`住客${index + 1}姓名`}
                                value={guest.name}
                                onChange={(e) => handleGuestNameChange(index, e.target.value)}
                                className="mb-4 text-gray-900"
                            />
                        ))}
                        {newGuests.length < 2 && (
                            <Button
                                variant="outline"
                                onClick={handleAddGuest}
                                className="mb-4 w-full text-gray-900"
                            >
                                添加住客
                            </Button>
                        )}
                        <Button onClick={handleCheckIn} className="w-full text-gray-900" icon={UserPlus}>
                            确认入住
                        </Button>
                    </div>
                )}
            </Dialog>

            <Dialog
                open={isManageGuestsOpen}
                onClose={() => setIsManageGuestsOpen(false)}
                title="住客管理"
                maxWidth="max-w-3xl"
            >
                <div className="max-h-80 overflow-y-auto custom-scrollbar-dark">
                    {currentRoom?.customers.length > 0 ? (
                        <table className="w-full text-sm text-left text-gray-900">
                            <thead className="text-small text-gray-700 uppercase bg-gray-100">
                            <tr>
                                <th scope="col" className="px-6 py-3">姓名</th>
                            </tr>
                            </thead>
                            <tbody>
                            {currentRoom.customers.map((customer, index) => (
                                <tr key={index} className="bg-white border-b">
                                    <td className="px-6 py-4 font-medium">{customer.name}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center text-gray-700 mb-4">该房间暂无住客</p>
                    )}

                    {currentRoom && currentRoom.customers.length < 2 && (
                        <div className="mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setIsAddGuestOpen(true)}
                                className="w-full"
                                icon={UserPlus}
                            >
                                添加住客
                            </Button>
                        </div>
                    )}
                </div>
                <div className="mt-4">
                    <Button
                        onClick={handleCheckOut}
                        className="w-full"
                        icon={LogOut}
                        variant="destructive"
                    >
                        退房
                    </Button>
                </div>
            </Dialog>

            <Dialog
                open={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                title="账单信息"
                maxWidth="max-w-2xl"
            >
                <style>{reportStyles}</style>
                <div className="max-h-96 overflow-y-auto custom-scrollbar-dark p-4">
                    <div dangerouslySetInnerHTML={{ __html: currentReport }} />
                </div>
                <div className="mt-4">
                    <Button onClick={handlePrintReport} className="w-full" icon={Printer}>
                        打印报告
                    </Button>
                </div>
            </Dialog>

            <Dialog
                open={isAddGuestOpen}
                onClose={() => {
                    setIsAddGuestOpen(false);
                    setNewGuestName('');
                }}
                title="添加住客"
            >
                <div>
                    <Input
                        placeholder="住客姓名"
                        value={newGuestName}
                        onChange={(e) => setNewGuestName(e.target.value)}
                        className="mb-4 text-gray-900"
                    />
                    <Button onClick={handleAddNewGuest} className="w-full" icon={UserPlus}>
                        添加
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

export default RoomManagement;
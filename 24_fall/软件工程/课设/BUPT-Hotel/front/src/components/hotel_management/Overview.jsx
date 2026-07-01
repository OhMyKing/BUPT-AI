import { useEffect, useState } from 'react';
import { getHotelRoomsOverview, getWeeklyGuestFlow, getAllRoomsACStatus } from '@/services/API';
import GlassCard from '@layout/GlassCard';
import GuestFlowChart from './GuestFlowChart';
import RoomHeatMap from './RoomHeatMap';
import ACRecordsList from './ACRecordsList';
import EnergyConsumptionChart from './EnergyConsumptionChart';

const Overview = ({ role }) => {
    const [rooms, setRooms] = useState([]);
    const [guestFlowData, setGuestFlowData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 获取空调状态数据用于能耗图表
                const acStatusResponse = await getAllRoomsACStatus();
                let acRoomsData = [];
                if (acStatusResponse.code === 0) {
                    acRoomsData = acStatusResponse.data;
                }

                if (role === 'AC_ADMIN') {
                    setRooms(acRoomsData);
                } else {
                    // 其他角色需要同时获取两种数据
                    const [roomsResponse, guestFlowResponse] = await Promise.all([
                        getHotelRoomsOverview(),
                        getWeeklyGuestFlow()
                    ]);
                    
                    if (roomsResponse.code === 0) {
                        const formattedRooms = roomsResponse.data.map(room => ({
                            id: room.roomId.toString(),
                            type: room.roomLevel,
                            customers: room.people.map(person => ({
                                id: person.peopleId,
                                name: person.peopleName
                            })),
                            energyConsumption: room.cost,
                            checkInTime: room.checkInTime,
                            // 添加空调数据
                            acData: acRoomsData.find(acRoom => acRoom.roomId.toString() === room.roomId.toString())
                        }));
                        setRooms(formattedRooms);
                    }
                    
                    if (guestFlowResponse.code === 0) {
                        setGuestFlowData(guestFlowResponse.data);
                    }
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [role]);

    // 计算房间统计信息
    const stats = role === 'AC_ADMIN' ? {
        // 空调管理员视图的统计信息
        totalRooms: rooms.length,
        totalEnergy: rooms.reduce((sum, room) => sum + (room.totalCost || 0), 0)
    } : {
        // 其他角色的统计信息
        occupiedRooms: rooms.filter(room => room.customers?.length > 0).length,
        totalRooms: rooms.length,
        currentGuests: rooms.reduce((sum, room) => sum + (room.customers?.length || 0), 0),
        totalEnergy: rooms.reduce((sum, room) => sum + (room.energyConsumption || 0), 0)
    };

    if (error) {
        return <div>错误: {error}</div>;
    }

    // 前台视图
    const ReceptionistView = () => (
        <div className="flex h-full space-x-4">
            <div className="w-1/2 flex flex-col space-y-4 h-full">
                {/* 第一个卡片占 1/6 */}
                <div className="flex space-x-4 h-1/6">
                    <GlassCard className="flex-1 flex flex-col items-center justify-center">
                        <h4 className="text-sm font-semibold mb-2">当前房间占用情况</h4>
                        <p className="text-2xl font-bold">{stats.occupiedRooms}/{stats.totalRooms}</p>
                    </GlassCard>
                    <GlassCard className="flex-1 flex flex-col items-center justify-center">
                        <h4 className="text-sm font-semibold mb-2">当前顾客数量</h4>
                        <p className="text-2xl font-bold">{stats.currentGuests}</p>
                    </GlassCard>
                </div>
                {/* 第二个卡片占 2/6 */}
                <GlassCard className="h-1/3 flex flex-col py-5">
                    <GuestFlowChart guestFlowData={guestFlowData} />
                </GlassCard>
                {/* 第三个卡片占 3/6 */}
                <GlassCard className="h-1/2 flex flex-col">
                    <h3 className="text-lg font-medium mb-4">最近记录</h3>
                    <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                        {guestFlowData
                            .sort((a, b) => new Date(b.time) - new Date(a.time))
                            .slice(0, 10)
                            .map((record, index) => {
                                const localTime = new Date(record.time);
                                return (
                                    <div key={index} className="mb-2 p-2 bg-white bg-opacity-10 rounded">
                                        <p>{localTime.toLocaleString()}</p>
                                        <p>房间: {record.roomId} - {record.operation}</p>
                                    </div>
                                )
                            })}
                    </div>
                </GlassCard>
            </div>
            <div className="w-1/2 h-full">
                <GlassCard className="h-full flex flex-col">
                    <h3 className="text-2xl font-semibold mb-4 text-center">房间入住状态图</h3>
                    <div className="flex-grow flex items-center justify-center">
                        <div className="w-11/12 h-11/12">
                            <RoomHeatMap
                                rooms={rooms.map(room => ({
                                    number: room.id,
                                    customerCount: room.customers.length,
                                    occupied: room.customers.length > 0,
                                    consumption: room.energyConsumption
                                }))}
                                mode="receptionist"
                            />
                        </div>
                    </div>
                    <p className="text-small text-center">颜色越深，房间入住人数越多</p>
                </GlassCard>
            </div>
        </div>
    );

    // 空调管理员视图
    const ACAdminView = () => {
        // 确保 rooms 数组存在且有数据
        if (!Array.isArray(rooms) || rooms.length === 0) {
            return <div>加载中...</div>;
        }

        const runningRooms = rooms.filter(room => 
            room.power === "on"
        ).length;

        const totalEnergy = rooms.reduce((sum, room) => 
            sum + (room.totalCost || 0), 0
        );

        return (
            <div className="flex h-full space-x-4">
                <div className="w-1/2 flex flex-col space-y-4 h-full">
                    <div className="flex space-x-4 h-1/6">
                        <GlassCard className="flex-1 flex flex-col items-center justify-center">
                            <h4 className="text-sm font-semibold mb-2">总能耗</h4>
                            <p className="text-2xl font-bold">{totalEnergy.toFixed(2)} KWH</p>
                        </GlassCard>
                        <GlassCard className="flex-1 flex flex-col items-center justify-center">
                            <h4 className="text-sm font-semibold mb-2">运行空调数</h4>
                            <p className="text-2xl font-bold">{runningRooms}</p>
                        </GlassCard>
                    </div>
                    <GlassCard className="h-1/3 flex flex-col py-5">
                        <ACRecordsList rooms={rooms}/>
                    </GlassCard>
                    <GlassCard className="h-1/2 flex flex-col">
                        <EnergyConsumptionChart rooms={rooms}/>
                    </GlassCard>
                </div>
                <div className="w-1/2 h-full">
                    <GlassCard className="h-full flex flex-col">
                        <h3 className="text-2xl font-semibold mb-4 text-center">房间能耗热力图</h3>
                        <div className="flex-grow flex items-center justify-center">
                            <div className="w-11/12 h-11/12">
                                <RoomHeatMap
                                    rooms={rooms.map(room => ({
                                        number: String(room.roomId),
                                        dispatch: room.status === 1,
                                        consumption: room.totalCost || 0,
                                        power: room.power === "on"
                                    }))}
                                    mode="ac_admin"
                                />
                            </div>
                        </div>
                        <p className="text-small text-center">颜色越深，房间消耗电量越多</p>
                    </GlassCard>
                </div>
            </div>
        );
    };

    // 经理视图
    const ManagerView = () => (
        <div className="flex h-full space-x-4">
            <div className="w-1/2 flex flex-col space-y-4 h-full">
                <div className="flex space-x-4 h-1/6">
                    <GlassCard className="flex-1 flex flex-col items-center justify-center">
                        <h4 className="text-sm font-semibold mb-2">入住率</h4>
                        <p className="text-2xl font-bold">
                            {((stats.occupiedRooms / stats.totalRooms) * 100).toFixed(1)}%
                        </p>
                    </GlassCard>
                    <GlassCard className="flex-1 flex flex-col items-center justify-center">
                        <h4 className="text-sm font-semibold mb-2">总能耗</h4>
                        <p className="text-2xl font-bold">{stats.totalEnergy.toFixed(2)} KWH</p>
                    </GlassCard>
                </div>
                <GlassCard className="flex-1 flex flex-col py-5">
                    <EnergyConsumptionChart 
                        rooms={rooms.map(room => ({
                            roomId: room.roomId,
                            roomTemperature: room.roomTemperature,
                            power: room.power,
                            temperature: room.temperature,
                            windSpeed: room.windSpeed,
                            mode: room.mode,
                            sweep: room.sweep,
                            cost: room.cost,
                            totalCost: room.totalCost,
                            status: room.status,
                            timeSlice: room.timeSlice
                        })).filter(Boolean)} 
                    />
                </GlassCard>
                <GlassCard className="flex-1">
                    <h3 className="text-lg font-medium mb-4">房型统计</h3>
                    <div className="space-y-4">
                        {Object.entries(
                            rooms.reduce((acc, room) => {
                                acc[room.type] = acc[room.type] || { total: 0, occupied: 0 };
                                acc[room.type].total++;
                                if (room.customers.length > 0) acc[room.type].occupied++;
                                return acc;
                            }, {})
                        ).map(([type, data]) => (
                            <div key={type} className="flex justify-between">
                                <span>{type}</span>
                                <span>{data.occupied}/{data.total}</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
            <div className="w-1/2 h-full">
                <GlassCard className="h-full flex flex-col">
                    <h3 className="text-2xl font-semibold mb-4 text-center">房间状态热力图</h3>
                    <div className="flex-grow flex items-center justify-center">
                        <div className="w-11/12 h-11/12">
                            <RoomHeatMap
                                rooms={rooms.map(room => ({
                                    number: room.id,
                                    occupied: room.customers.length > 0,
                                    consumption: room.energyConsumption
                                }))}
                                mode="manager"
                            />
                        </div>
                    </div>
                    <p className="text-small text-center">颜色越深，房间消耗电量越多</p>
                </GlassCard>
            </div>
        </div>
    );

    const viewMap = {
        RECEPTIONIST: ReceptionistView,
        AC_ADMIN: ACAdminView,
        MANAGER: ManagerView
    };

    const ViewComponent = viewMap[role] || ReceptionistView;
    return <ViewComponent />;
};

export default Overview;
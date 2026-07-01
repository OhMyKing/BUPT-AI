import { createContext, useContext, useState } from 'react';

// 简单的伪随机数生成器
class SeededRandom {
    constructor(seed = 12345) {
        this.seed = seed;
    }

    // 返回0-1之间的随机数
    random() {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    // 返回指定范围内的整数
    randInt(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    // 从数组中随机选择一个元素
    choice(array) {
        return array[this.randInt(0, array.length - 1)];
    }
}

const rng = new SeededRandom(12345);

const randomCustomers = () => {
    const numCustomers = rng.randInt(0, 2); // 随机生成0到2个客户
    const names = ["张三", "李四", "王五", "赵六", "孙七"];
    return Array.from({ length: numCustomers }, (_, i) => ({
        id: `c${(rng.random() * 10000).toString(36).substring(2, 6)}`,
        name: rng.choice(names)
    }));
};

const randomAcSettings = () => ({
    power: rng.random() < 0.5,
    temperature: rng.random() < 0.5 ? rng.randInt(20, 30) : null,
    fanSpeed: rng.choice(["自动", "低", "中", "高"]),
    mode: rng.choice(["制冷", "制热", "除湿"]),
    swing: rng.random() < 0.5,
    dispatch: rng.random() < 0.5
});

const generateACRecords = () => {
    const records = [];
    const now = new Date();
    const sixHoursAgo = new Date(now - 6 * 60 * 60 * 1000);

    // 每15分钟一条记录
    for (let time = sixHoursAgo; time <= now; time = new Date(time.getTime() + 15 * 60 * 1000)) {
        // 基础能耗 (0.2 - 0.4 kWh)
        let baseConsumption = 0.2 + rng.random() * 0.2;

        // 根据时间段调整能耗
        const hour = time.getHours();
        if (hour >= 12 && hour <= 14) {  // 午间高峰
            baseConsumption *= 1.5;
        } else if (hour >= 18 && hour <= 20) {  // 晚间高峰
            baseConsumption *= 1.8;
        } else if (hour >= 2 && hour <= 5) {  // 凌晨低谷
            baseConsumption *= 0.6;
        }

        // 添加一些随机波动 (±20%)
        const fluctuation = 0.8 + rng.random() * 0.4;
        const finalConsumption = (baseConsumption * fluctuation).toFixed(2);

        records.push({
            time: time.toISOString(),
            energyConsumption: finalConsumption,
            power: rng.random() < 0.8 ? "on" : "off", // 80%概率开启
            temperature: rng.randInt(22, 27), // 22-27度
            windSpeed: rng.choice(["低", "中", "高"]),
            mode: rng.choice(["制冷", "制热", "除湿"]),
            sweep: rng.random() < 0.5 ? "开" : "关"
        });
    }

    return records;
};

const randomRecords = (type) => {
    if (type === "ac") {
        return generateACRecords();
    }

    const numRecords = rng.randInt(0, 2);
    const TWELVE_HOURS = 12 * 60 * 60 * 1000; // 12小时的毫秒数

    return Array.from({ length: numRecords }, (_, i) => {
        // 生成过去12小时内的随机时间
        const now = Date.now();
        const randomTime = now - Math.floor(rng.random() * TWELVE_HOURS);

        return {
            time: new Date(randomTime).toISOString(),
            personId: `c${(rng.random() * 10000).toString(36).substring(2, 6)}`,
            personName: rng.choice(["张三", "李四", "王五", "赵六", "孙七"]),
            actionType: rng.choice(["入住", "退房"])
        };
    });
};

const randomEnergyConsumption = () => rng.randInt(0, 100);

export const useRoomContext = () => {
    const context = useContext(RoomContext);
    if (!context) {
        throw new Error('useRoomContext must be used within a RoomProvider');
    }
    return context;
};

const RoomContext = createContext();

export const RoomProvider = ({ children }) => {
    const [rooms, setRooms] = useState([
        // 标准房 30 个
        ...Array.from({ length: 30 }, (_, i) => ({
            id: `${2001 + i}`,
            type: "标准房",
            customers: randomCustomers(),
            energyConsumption: randomEnergyConsumption(),
            acSettings: randomAcSettings(),
            room_records: randomRecords("room"),
            ac_records: randomRecords("ac")
        })),
        // 大床房 10 个 (含已有一个 1001)
        ...Array.from({ length: 9 }, (_, i) => ({
            id: `${3001 + i}`,
            type: "大床房",
            customers: randomCustomers(),
            energyConsumption: randomEnergyConsumption(),
            acSettings: randomAcSettings(),
            room_records: randomRecords("room"),
            ac_records: randomRecords("ac")
        })),
        ...Array.from({ length: 10 }, (_, i) => ({
            id: `${4001 + i}`,
            type: "大床房",
            customers: randomCustomers(),
            energyConsumption: randomEnergyConsumption(),
            acSettings: randomAcSettings(),
            room_records: randomRecords("room"),
            ac_records: randomRecords("ac")
        })),
        ...Array.from({ length: 10 }, (_, i) => ({
            id: `${5001 + i}`,
            type: "大床房",
            customers: randomCustomers(),
            energyConsumption: randomEnergyConsumption(),
            acSettings: randomAcSettings(),
            room_records: randomRecords("room"),
            ac_records: randomRecords("ac")
        }))
    ]);

    const updateRoom = (roomId, updatedData) => {
        setRooms(prevRooms =>
            prevRooms.map(room =>
                room.id === roomId ? { ...room, ...updatedData } : room
            )
        );
    };

    const addRoom = (newRoom) => {
        setRooms(prevRooms => [...prevRooms, newRoom]);
    };

    const deleteRoom = (roomId) => {
        setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
    };

    return (
        <RoomContext.Provider value={{ rooms, updateRoom, addRoom, deleteRoom }}>
            {children}
        </RoomContext.Provider>
    );
};
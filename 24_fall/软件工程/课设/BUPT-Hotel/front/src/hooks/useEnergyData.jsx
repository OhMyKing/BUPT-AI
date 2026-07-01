import { useState, useEffect } from 'react';

const useEnergyData = () => {
    const [energyData, setEnergyData] = useState([]);
    const [totalCost, setTotalCost] = useState(0);

    useEffect(() => {
        // 生成能耗数据
        const newEnergyData = Array(6).fill().map((_, i) => ({
            time: `${23 - i}:00`,
            energy: Math.random() * 2 + 1
        })).reverse();

        setEnergyData(newEnergyData);

        // 计算总成本
        const newTotalCost = newEnergyData.reduce(
            (sum, data) => sum + data.energy * 0.5,
            0
        );
        setTotalCost(newTotalCost.toFixed(2));
    }, []);

    return { energyData, totalCost };
};

export default useEnergyData;
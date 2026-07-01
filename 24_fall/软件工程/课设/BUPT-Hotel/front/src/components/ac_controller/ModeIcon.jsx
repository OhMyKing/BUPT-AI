import { Sun, Snowflake, Droplet, Wind, Power } from 'lucide-react';

const ModeIcon = ({ mode, isOn }) => {
    // 如果空调关闭，显示关机图标
    if (!isOn) {
        return <Power className="w-8 h-8 text-white-400" />;
    }

    // 空调开启时，根据模式显示对应图标
    switch (mode) {
        case '制冷':
            return <Snowflake className="w-8 h-8"/>;
        case '制热':
            return <Sun className="w-8 h-8"/>;
        case '除湿':
            return <Droplet className="w-8 h-8"/>;
        case '清洁':
            return <Wind className="w-8 h-8" />;
        default:
            return null;
    }
};

export default ModeIcon;
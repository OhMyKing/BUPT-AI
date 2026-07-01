import { Wind, RefreshCw } from 'lucide-react';
import GlassCard from '@layout/GlassCard';

const FanSpeedSelector = ({ fanSpeed, isSwingOn, onStateChange }) => {
    const buttonClass = "p-3 rounded-xl flex flex-col items-center justify-center transition-all duration-300 w-full h-full";
    const activeButtonClass = "bg-white bg-opacity-40";
    const inactiveButtonClass = "bg-white bg-opacity-20 hover:bg-opacity-25";

    const fanSpeeds = ['低', '中', '高'];

    const handleSwingToggle = () => {
        onStateChange({ isSwingOn: !isSwingOn });
    };

    return (
        <GlassCard className="flex-shrink-0 py-5">
            <div className="grid grid-cols-4 gap-4">
                {fanSpeeds.map((speed) => (
                    <button
                        key={speed}
                        onClick={() => onStateChange({ fanSpeed: speed })}
                        className={`${buttonClass} ${fanSpeed === speed ? activeButtonClass : inactiveButtonClass}`}
                    >
                        <Wind className={`w-6 h-6 text-white ${speed === '高' ? 'animate-spin-fast' : speed === '中' ? 'animate-spin-medium' : ''}`}/>
                        <span className="mt-1 text-xs text-white">{speed}速</span>
                    </button>
                ))}
                <button
                    onClick={handleSwingToggle}
                    className={`${buttonClass} ${isSwingOn ? activeButtonClass : inactiveButtonClass}`}
                >
                    <RefreshCw className="w-6 h-6 text-white"/>
                    <span className="mt-1 text-xs text-white">
                        扫风{isSwingOn ? '开启' : '关闭'}
                    </span>
                </button>
            </div>
        </GlassCard>
    );
};

export default FanSpeedSelector;
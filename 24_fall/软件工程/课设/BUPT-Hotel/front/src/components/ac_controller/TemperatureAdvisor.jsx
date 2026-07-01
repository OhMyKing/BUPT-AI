import GlassCard from '@layout/GlassCard';

const TemperatureAdvisor = ({ temperature = 24 }) => {
    // 根据室温生成详细建议
    const getTemperatureSuggestion = (temp) => {
        if (temp >= 32) {
            return {
                status: "温度过高",
                suggestion: "建议将空调调至26°C制冷模式，避免室内温度过高导致不适"
            };
        } else if (temp >= 28 && temp < 32) {
            return {
                status: "温度偏高",
                suggestion: "建议开启制冷模式，将温度调至27°C左右，保持室内凉爽舒适"
            };
        } else if (temp >= 25 && temp < 28) {
            return {
                status: "温度略高",
                suggestion: "可以开启制冷模式，调至25°C，让室内保持在舒适温度"
            };
        } else if (temp > 22 && temp < 25) {
            return {
                status: "温度适宜",
                suggestion: "当前温度非常舒适，无需调整空调，可以保持自然通风"
            };
        } else if (temp >= 18 && temp <= 22) {
            return {
                status: "温度略低",
                suggestion: "可以开启制热模式，调至23°C，让室内回暖至舒适温度"
            };
        } else if (temp >= 14 && temp < 18) {
            return {
                status: "温度偏低",
                suggestion: "建议开启制热模式，将温度调至24°C左右，避免室内温度过低"
            };
        } else {
            return {
                status: "温度过低",
                suggestion: "建议将空调调至25°C制热模式，及时提升室内温度，预防感冒"
            };
        }
    };

    const suggestion = getTemperatureSuggestion(temperature);

    return (
        <GlassCard className="w-full py-6">
            <div className="flex items-center justify-between px-1">
                {/* 左侧温度信息 */}
                <div className="flex flex-col items-start">
                    <div className="text-sm text-white/90 mb-1">
                        室内温度
                    </div>
                    <div className="text-5xl font-bold text-white">
                        {temperature}°C
                    </div>
                </div>

                {/* 右侧温度建议 */}
                <div className="flex-1 text-right ml-8">
                    <div className="text-sm font-medium text-white">
                        {suggestion.status}
                    </div>
                    <div className="text-xs text-white/90">
                        {suggestion.suggestion}
                    </div>
                </div>
            </div>
        </GlassCard>
    );
};

export default TemperatureAdvisor;
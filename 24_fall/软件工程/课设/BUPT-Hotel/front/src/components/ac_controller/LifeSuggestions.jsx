import { Sun, Cloud, CloudRain, Droplets, Moon } from 'lucide-react';
import suggestionGif from '@assets/suggestion.gif';
import NormalCard from "@layout/NormalCard.jsx";
import { useWeather } from '@contexts/WeatherContext';



// 室外天气背景图片
import cloudDay from '@assets/weather/cloud_day.png';
import cloudNight from '@assets/weather/cloud_night.png';
import rainDay from '@assets/weather/rain_day.png';
import rainNight from '@assets/weather/rain_night.png';
import sunDay from '@assets/weather/sun_day.png';
import sunNight from '@assets/weather/sun_night.png';
import windDay from '@assets/weather/wind_day.png';
import windNight from '@assets/weather/wind_night.png';
import React from "react";

const getWeatherIcon = (text, hour = new Date().getHours()) => {
    const isNight = hour < 6 || hour >= 18;

    if (text?.includes('晴')) {
        return isNight ? 
            <Moon className="w-12 h-12 text-gray-400" /> : 
            <Sun className="w-12 h-12 text-yellow-400" />;
    }
    if (text?.includes('雨')) return <CloudRain className="w-12 h-12 text-blue-400" />;
    return <Cloud className="w-12 h-12 text-gray-400" />;
};

const getBackgroundImage = (text, hour = new Date().getHours()) => {
    const isNight = hour < 6 || hour >= 18;

    if (text?.includes('雨')) {
        return isNight ? rainNight : rainDay;
    }
    if (text?.includes('晴')) {
        return isNight ? sunNight : sunDay;
    }
    if (text?.includes('云') || text?.includes('阴')) {
        return isNight ? cloudNight : cloudDay;
    }
    if (text?.includes('风')) {
        return isNight ? windNight : windDay;
    }

    // 默认返回晴天图片
    return isNight ? sunNight : sunDay;
};

const getWeatherSuggestion = (temp, text, humidity) => {
    let suggestion = '';

    // 基于温度的建议
    if (temp > 30) {
        suggestion += '室外天气炎热，注意防暑降温，建议减少户外活动。';
    } else if (temp > 20) {
        suggestion += '温度适宜，适合进行户外活动。';
    } else if (temp > 10) {
        suggestion += '温度较凉，户外活动请适当添加衣物。';
    } else {
        suggestion += '室外天气寒冷，注意保暖，尽量减少户外活动时间。';
    }

    // 基于室外天气状况的建议
    if (text?.includes('雨')) {
        suggestion += '当前正在下雨，请携带雨具。';
    } else if (text?.includes('晴')) {
        suggestion += '室外天气晴朗，注意防晒。';
    }

    // 基于湿度的建议
    if (humidity > 80) {
        suggestion += '湿度较大，注意防潮。';
    } else if (humidity < 30) {
        suggestion += '湿度偏低，注意补充水分。';
    }

    return suggestion;
};

const WeatherInfo = ({ weatherData }) => (
    <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
            {getWeatherIcon(weatherData?.text, new Date().getHours())}
            <span className="ml-2 text-2xl font-bold text-black">
                {weatherData?.temp || '--'}°C
            </span>
        </div>
        <div className="flex items-center">
            <Droplets className="w-8 h-8 text-blue-400" />
            <span className="ml-2 text-xl font-bold text-black">
                {weatherData?.humidity || '--'}%
            </span>
        </div>
    </div>
);

const LifeSuggestions = () => {
    const { weatherData, loading, error, setWeatherSuggestion } = useWeather();

    // 当室外天气数据更新时，更新建议
    React.useEffect(() => {
        if (weatherData) {
            const suggestion = getWeatherSuggestion(
                parseFloat(weatherData.temp),
                weatherData.text,
                parseFloat(weatherData.humidity)
            );
            setWeatherSuggestion(suggestion);
        }
    }, [weatherData, setWeatherSuggestion]);

    if (loading) {
        return (
            <NormalCard className="flex-1 flex flex-col">
                <h2 className="text-2xl font-bold text-black mb-4">室外天气</h2>
                <div className="flex-1 flex items-center justify-center">
                    <span className="text-gray-500">加载中...</span>
                </div>
            </NormalCard>
        );
    }

    if (error) {
        return (
            <NormalCard className="flex-1 flex flex-col">
                <h2 className="text-2xl font-bold text-black mb-4">室外天气</h2>
                <div className="flex-1 flex items-center justify-center">
                    <span className="text-red-500">获取室外天气数据失败</span>
                </div>
            </NormalCard>
        );
    }

    const backgroundImage = getBackgroundImage(weatherData?.text);

    return (
        <NormalCard className="flex-1 flex flex-col">
            <h2 className="text-2xl font-bold text-black mb-4">室外天气</h2>
            <WeatherInfo weatherData={weatherData} />
            <div className="flex-1 flex flex-col items-center justify-center mb-6 relative">
                <img
                    src={suggestionGif}
                    alt="运动建议"
                    className="absolute rounded-lg z-20"
                />
                <img
                    src={backgroundImage}
                    alt="室外天气背景"
                    className="absolute rounded-lg z-10"
                />
            </div>
            <p className="text-black text-opacity-80">
                {getWeatherSuggestion(
                    parseFloat(weatherData?.temp),
                    weatherData?.text,
                    parseFloat(weatherData?.humidity)
                )}
            </p>
        </NormalCard>
    );
};

export default LifeSuggestions;
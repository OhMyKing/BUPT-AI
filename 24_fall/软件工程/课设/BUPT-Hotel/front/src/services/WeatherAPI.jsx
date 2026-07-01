import { useState, useEffect } from 'react';

const API_KEY = import.meta.env.VITE_QWEATHER_API_KEY;
const LOCATION = '101010100'; // 北京的 LocationID

function useWeatherData() {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWeatherData = async () => {
            try {
                const response = await fetch(
                    `https://devapi.qweather.com/v7/weather/now?location=${LOCATION}&key=${API_KEY}`
                );

                if (!response.ok) {
                    throw new Error('Weather data fetch failed');
                }

                const data = await response.json();
                if (data.code === '200') {
                    setWeatherData(data.now);
                } else {
                    throw new Error(`API Error: ${data.code}`);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchWeatherData();
        // 每5分钟刷新一次生活建议数据
        const interval = setInterval(fetchWeatherData, 300000);

        return () => clearInterval(interval);
    }, []);

    return { weatherData, loading, error };
}

export default useWeatherData;
import { createContext, useContext, useState } from 'react';
import useWeatherData from "@/services/WeatherAPI.jsx";

const WeatherContext = createContext(null);

export function WeatherProvider({ children }) {
    const weatherDataResult = useWeatherData();
    const [weatherSuggestion, setWeatherSuggestion] = useState('');

    const value = {
        ...weatherDataResult,
        weatherSuggestion,
        setWeatherSuggestion
    };

    return (
        <WeatherContext.Provider value={value}>
            {children}
        </WeatherContext.Provider>
    );
}

export function useWeather() {
    const context = useContext(WeatherContext);
    if (!context) {
        throw new Error('useWeather must be used within a WeatherProvider');
    }
    return context;
}
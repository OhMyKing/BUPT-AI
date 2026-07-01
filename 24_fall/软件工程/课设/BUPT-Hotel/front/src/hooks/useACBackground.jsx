import { useEffect } from 'react';

const modeGradients = {
    制冷: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    制热: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    除湿: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    清洁: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    off: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)'
};

const useACBackground = (mode, isOn, setBgStyle) => {
    useEffect(() => {
        const newBgStyle = {
            backgroundImage: isOn ? modeGradients[mode] : modeGradients.off,
            transition: 'background-image 0.5s ease'
        };
        setBgStyle(newBgStyle);
    }, [mode, isOn, setBgStyle]);

    return modeGradients;
};

export default useACBackground;
import React from 'react';

const LoadingSpinner = () => {
    return (
        <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <span className="ml-3 text-white">加载中...</span>
        </div>
    );
};

export default LoadingSpinner; 
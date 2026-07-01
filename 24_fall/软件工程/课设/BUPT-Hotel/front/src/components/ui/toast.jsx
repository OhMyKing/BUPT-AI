import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

// 单个 Toast 组件
export const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const getIcon = () => {
        if (type === 'success') {
            return <CheckCircle2 className="flex-shrink-0" size={20} />;
        }
        return <AlertCircle className="flex-shrink-0" size={20} />;
    };

    return (
        <div
            className={`w-80 px-4 py-2 rounded-lg text-white flex items-center space-x-2 animate-fade-in-up ${
                type === 'error' ? 'bg-red-500' : 'bg-green-500'
            }`}
        >
            {getIcon()}
            <span className="flex-grow">{message}</span>
        </div>
    );
};

// Toast 容器组件
export const ToastContainer = () => {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'error') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        // 3秒后自动移除
        setTimeout(() => {
            removeToast(id);
        }, 3000);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    // 导出方法供外部使用
    ToastContainer.addToast = addToast;

    return (
        <div className="fixed bottom-4 right-4 flex flex-col-reverse gap-2 z-[9999] max-h-screen overflow-hidden">
            {toasts.map(toast => (
                <div key={toast.id}>
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                </div>
            ))}
        </div>
    );
};
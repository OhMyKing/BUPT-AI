import { createContext, useContext, useState, useEffect } from 'react';

const TaskContext = createContext(null);

export const TaskProvider = ({ children, onTaskExecute }) => {
    const [tasks, setTasks] = useState([]);

    const FAN_SPEED_MAP = {
        '低': '低速',
        '中': '中速',
        '高': '高速',
    };

    // 检查并执行定时任务
    useEffect(() => {
        const checkTasks = () => {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
            const currentDay = now.getDate();

            tasks.forEach((task, index) => {
                if (task.time === currentTimeStr) {
                    const taskDate = new Date();
                    if (task.day === 'tomorrow') {
                        taskDate.setDate(taskDate.getDate() + 1);
                    }

                    if (taskDate.getDate() === currentDay) {
                        // 转换任务格式以匹配 API 要求
                        const formattedTask = {
                            power: task.action,
                            temperature: parseInt(task.temperature),
                            // 将显示用的风速值转换为API所需的值
                            windSpeed: task.fanSpeed === '低速' ? '低' : 
                                     task.fanSpeed === '中速' ? '中' : 
                                     task.fanSpeed === '高速' ? '高' : '中',
                            // 确保扫风值符合API要求
                            sweep: task.isSwingOn ? '开' : '关'
                        };

                        onTaskExecute(formattedTask);

                        const updatedTasks = [...tasks];
                        updatedTasks.splice(index, 1);
                        setTasks(updatedTasks);
                    }
                }
            });
        };

        // 计算到下一个整分钟的毫秒数
        const now = new Date();
        const nextMinute = new Date(now);
        nextMinute.setMinutes(now.getMinutes() + 1, 0, 0);
        const delay = nextMinute - now;

        // 先设置一个定时器到下一个整分钟
        const initialTimeout = setTimeout(() => {
            checkTasks();
            // 然后设置每分钟执行一次的定时器
            const interval = setInterval(checkTasks, 60000);
            // 保存interval的引用以便清理
            setIntervalRef(interval);
        }, delay);

        // 保存对定时器的引用
        const intervalRef = { timeout: initialTimeout, interval: null };
        const setIntervalRef = (interval) => {
            intervalRef.interval = interval;
        };

        // 组件卸载时清除所有定时器
        return () => {
            clearTimeout(intervalRef.timeout);
            if (intervalRef.interval) {
                clearInterval(intervalRef.interval);
            }
        };
    }, [tasks, onTaskExecute]);

    const validateTime = (time, day) => {
        const [hours, minutes] = time.split(':').map(Number);
        const selectedTime = new Date();
        selectedTime.setHours(hours, minutes, 0, 0);

        if (day === 'tomorrow') {
            selectedTime.setDate(selectedTime.getDate() + 1);
        }

        const now = new Date();
        return selectedTime > now;
    };

    const addTask = (newTask) => {
        if (!newTask.time) {
            throw new Error('请选择时间');
        }
        if (!validateTime(newTask.time, newTask.day)) {
            throw new Error('不能将时间设置在当前时间之前');
        }

        // 检查时间冲突
        const hasConflict = tasks.some(task => {
            const sameTime = task.time === newTask.time;
            const sameDay = task.day === newTask.day;
            return sameTime && sameDay;
        });

        if (hasConflict) {
            throw new Error('该时间点已有定时任务');
        }

        setTasks([...tasks, newTask]);
    };

    const deleteTask = (index) => {
        const updatedTasks = [...tasks];
        updatedTasks.splice(index, 1);
        setTasks(updatedTasks);
    };

    return (
        <TaskContext.Provider value={{
            tasks,
            addTask,
            deleteTask,
            validateTime,
            onTaskExecute,
        }}>
            {children}
        </TaskContext.Provider>
    );
};

export const useTasks = () => {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTasks must be used within a TaskProvider');
    }
    return context;
};
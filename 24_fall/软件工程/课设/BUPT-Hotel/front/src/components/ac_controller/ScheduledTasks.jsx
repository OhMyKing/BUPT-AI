// ScheduledTasks.jsx
import { useState } from 'react';
import { Clock, Plus, Trash2 } from 'lucide-react';
import ReactDOM from 'react-dom';
import { useTasks } from '@/contexts/TaskContext';

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
            <div className="bg-white bg-opacity-75 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-96 z-10">
                {children}
            </div>
        </div>,
        document.body
    );
};

const ScheduledTasks = ({ onTaskExecute }) => {
    const { tasks, addTask, deleteTask, validateTime } = useTasks();
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [timeError, setTimeError] = useState('');
    const [newTask, setNewTask] = useState({
        time: '',
        day: 'today',
        action: 'off',
        temperature: 25,
        fanSpeed: '低速',
        sweep: '开'
    });

    const handleTimeChange = (time) => {
        setTimeError('');
        try {
            if (time && !validateTime(time, newTask.day)) {
                setTimeError('不能将时间设置在当前时间之前');
                return;
            }
            setNewTask({ ...newTask, time });
        } catch (error) {
            setTimeError(error.message);
        }
    };

    const handleDayChange = (day) => {
        setTimeError('');
        try {
            if (newTask.time && !validateTime(newTask.time, day)) {
                setTimeError('不能将时间设置在当前时间之前');
                return;
            }
            setNewTask({ ...newTask, day });
        } catch (error) {
            setTimeError(error.message);
        }
    };

    const handleAddTask = () => {
        if (!newTask.time) {
            setTimeError('请选择时间');
            return;
        }

        try {
            const taskToAdd = {
                ...newTask,
                temperature: Math.round(newTask.temperature),
                fanSpeed: newTask.fanSpeed,
                sweep: newTask.sweep
            };

            addTask(taskToAdd);
            setIsAddingTask(false);
            setNewTask({
                time: '',
                day: 'today',
                action: 'off',
                temperature: 25,
                fanSpeed: '低速',
                sweep: '开'
            });
            setTimeError('');
        } catch (error) {
            setTimeError(error.message);
        }
    };

    const inputClasses = "w-full mb-4 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out bg-white bg-opacity-50 text-gray-800 placeholder-gray-500";

    return (
        <div className="flex flex-col bg-white bg-opacity-20 backdrop-blur-lg rounded-3xl p-6 shadow-lg h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <Clock className="w-8 h-8 text-white mr-2" />
                    <h3 className="text-2xl font-bold text-white">定时任务</h3>
                </div>
                <button
                    onClick={() => setIsAddingTask(true)}
                    className="p-2 bg-blue-500 rounded-full text-white hover:bg-blue-600 focus:outline-none transition duration-300 ease-in-out transform hover:scale-110"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-2 overflow-y-auto h-96 pr-2 custom-scrollbar">
                {tasks.map((task, index) => (
                    <div key={index}
                         className="grid grid-cols-8 items-center text-white bg-white bg-opacity-10 rounded-lg p-3 transition duration-300 ease-in-out hover:bg-opacity-20">
                        <span className="font-semibold">{task.time}</span>
                        <span className="text-sm"/>
                        <span className="text-sm">{task.day === 'today' ? '今天' : '明天'}</span>
                        <div className="flex items-center">
                            <span className="text-sm">{task.action === 'on' ? '开机' : '关机'}</span>
                        </div>
                        {task.action === 'on' && (
                            <>
                                <span className="text-sm">{task.temperature}°C</span>
                                <span className="text-sm">{task.fanSpeed}</span>
                                <span className="text-sm">{task.sweep}</span>
                            </>
                        )}
                        {task.action === 'off' && <span className="col-span-3"></span>}
                        <div className="flex justify-end">
                            <button
                                onClick={() => deleteTask(index)}
                                className="p-1 bg-white/10 hover:bg-white/20 rounded-full transition duration-300 ease-in-out hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4 text-white"/>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isAddingTask} onClose={() => {
                setIsAddingTask(false);
                setTimeError('');
            }}>
                <h4 className="text-2xl font-bold mb-6 text-gray-800">添加新任务</h4>
                <div className="mb-4">
                    <input
                        type="time"
                        value={newTask.time}
                        onChange={(e) => handleTimeChange(e.target.value)}
                        className={`${inputClasses} ${timeError ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {timeError && <p className="text-red-500 text-sm mt-1">{timeError}</p>}
                </div>
                <select
                    value={newTask.day}
                    onChange={(e) => handleDayChange(e.target.value)}
                    className={inputClasses}
                >
                    <option value="today">今天</option>
                    <option value="tomorrow">明天</option>
                </select>
                <select
                    value={newTask.action}
                    onChange={(e) => setNewTask({...newTask, action: e.target.value})}
                    className={inputClasses}
                >
                    <option value="on">开机</option>
                    <option value="off">关机</option>
                </select>
                {newTask.action === 'on' && (
                    <>
                        <input
                            type="number"
                            value={newTask.temperature}
                            onChange={(e) => setNewTask({ ...newTask, temperature: parseInt(e.target.value) })}
                            className={inputClasses}
                            placeholder="温度"
                        />
                        <select
                            value={newTask.fanSpeed}
                            onChange={(e) => setNewTask({ ...newTask, fanSpeed: e.target.value })}
                            className={inputClasses}
                        >
                            <option>低速</option>
                            <option>中速</option>
                            <option>高速</option>
                        </select>
                        <select
                            value={newTask.sweep}
                            onChange={(e) => setNewTask({ ...newTask, sweep: e.target.value })}
                            className={inputClasses}
                        >
                            <option value="开">开启摆风</option>
                            <option value="关">关闭摆风</option>
                        </select>
                    </>
                )}
                <div className="flex justify-end">
                    <button
                        onClick={() => {
                            setIsAddingTask(false);
                            setTimeError('');
                        }}
                        className="mr-4 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none transition duration-300 ease-in-out"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleAddTask}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none transition duration-300 ease-in-out"
                    >
                        添加
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default ScheduledTasks;
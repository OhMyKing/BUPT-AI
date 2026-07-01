export const AC_CONSTRAINTS = {
    temperature: {
        min: 16,
        max: 30
    },
    fanSpeeds: ['低速', '中速', '高速'],
    powerOptions: ['on', 'off'],
    sweepOptions: ['开', '关']
};

export const validateACSettings = (settings) => {
    const errors = [];

    if (settings.temp !== undefined) {
        const temp = Number(settings.temp);
        if (isNaN(temp) || temp < AC_CONSTRAINTS.temperature.min || temp > AC_CONSTRAINTS.temperature.max) {
            errors.push(`温度必须在 ${AC_CONSTRAINTS.temperature.min}℃ 到 ${AC_CONSTRAINTS.temperature.max}℃ 之间`);
        }
    }

    if (settings.fan !== undefined && !AC_CONSTRAINTS.fanSpeeds.includes(settings.fan)) {
        errors.push(`风速只能是 ${AC_CONSTRAINTS.fanSpeeds.join('、')} 之一`);
    }

    if (settings.power !== undefined && !AC_CONSTRAINTS.powerOptions.includes(settings.power)) {
        errors.push(`电源只能是 on 或 off`);
    }

    return errors;
};

export const parseAIResponse = (content, onAdjustAC, onScheduleTask, onDeleteTask, currentACState) => {
    try {
        const lines = content.trim().split('\n');
        let naturalLanguageLines = [];
        let commands = [];

        // 遍历所有行，分离自然语言和命令
        for (let line of lines) {
            // 处理两种可能的命令前缀CMD__ 或 __CMD__
            if (line.includes('CMD__')) {
                try {
                    const commandJson = line.replace(/^.*?CMD__/, '');
                    const command = JSON.parse(commandJson);
                    commands.push(command);
                } catch (error) {
                    console.warn('Failed to parse command:', line, error);
                    naturalLanguageLines.push(line);
                }
            } else if (line.trim()) { // 只添加非空的自然语言行
                naturalLanguageLines.push(line);
            }
        }

        // 处理所有找到的命令
        for (const command of commands) {
            switch (command.type) {
                case 'adjust_ac':
                    handleAdjustAC(command, onAdjustAC);
                    break;
                case 'schedule':
                    handleScheduleTask(command, currentACState, onScheduleTask);
                    break;
                case 'delete_schedule':
                    onDeleteTask(command.index);
                    break;
                default:
                    console.warn('Unknown command type:', command.type);
            }
        }

        // 如果没有自然语言内容但有命令，返默认回复
        if (naturalLanguageLines.length === 0 && commands.length > 0) {
            return "好的！";
        }

        // 返回清理后的自然语言内容
        return naturalLanguageLines.join('\n').trim();
    } catch (error) {
        console.error('Error parsing AI response:', error);
        return content; // 出错时返回原始内容
    }
};

// 修改映射常量
const SWEEP_MAP = {
    true: '开',
    false: '关'
};

const POWER_MAP = {
    'on': 'on',
    'off': 'off'
};

// 修改风速映射（AI命令到API参数的映射）
const FAN_SPEED_MAP = {
    '低速': '低',
    '中速': '中',
    '高速': '高'
};

// 反向风速映射（API参数到显示的映射）
const REVERSE_FAN_SPEED_MAP = {
    '低': '低速',
    '中': '中速',
    '高': '高速'
};

const handleAdjustAC = (command, onAdjustAC) => {
    const settings = {
        temperature: command.temp,
        // 将AI命令的风速转换为API所需的格式
        windSpeed: FAN_SPEED_MAP[command.fan] || command.fan,
        // 将布尔值转换为"开"/"关"
        sweep: command.swing !== undefined ? SWEEP_MAP[command.swing] : undefined,
        // 保持电源的on/off格式
        power: command.power
    };

    // 验证设置
    const validationErrors = validateACSettings({
        temp: command.temp,
        // 验证时使用原始的风速值
        fan: command.fan
    });
    
    if (validationErrors.length > 0) {
        console.error('AC settings validation failed:', validationErrors);
        return;
    }

    onAdjustAC(settings);
};

const handleScheduleTask = (command, currentACState, onScheduleTask) => {
    const task = {
        time: command.time,
        day: command.day || 'today',
        action: command.action || 'off',
        temperature: command.temp || currentACState.temperature,
        // 将AI命令的风速转换为API所需的格式
        fanSpeed: FAN_SPEED_MAP[command.fan] || FAN_SPEED_MAP[currentACState.windSpeed],
        // 将布尔值转换为"开"/"关"
        sweep: command.swing ? '开' : '关'
    };

    // 验证设置
    if (task.action === 'on') {
        const validationErrors = validateACSettings({
            temp: task.temperature,
            fan: command.fan
        });

        if (validationErrors.length > 0) {
            console.error('Task settings validation failed:', validationErrors);
            return;
        }
    }

    onScheduleTask(task);
};
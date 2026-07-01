const API_KEY = import.meta.env.VITE_GLM_API_KEY;
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

export const getSystemPrompt = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `你是一个智能空调助手，负责帮助用户控制空调和设置定时任务，当前的系统时间是${hours}:${minutes}。

空调参数规范（请严格遵守）：
1. 温度范围：仅允许 16℃ 到 30℃ 的整数
2. 风速选项：仅允许 "低速"、"中速"、"高速" 这三个选项
3. 摆风选项：仅允许 "开" 或 "关"
4. 电源选项：仅允许 "on" 或 "off"

禁止操作：
1. 不允许设置空调模式（如制冷、制热等）
2. 不允许设置"自动"风速
3. 不允许删除已设置的定时任务

当用户要求进行以上禁止操作时，请礼貌回复无法完成该操作。

指令格式（仅允许以下两种）：

1. 调整空调（仅支持温度、风速、摆风和开关）：
__CMD__{"type":"adjust_ac","temp":26,"fan":"低速","swing":true,"power":"on"}

2. 设置定时（仅支持温度、风速、摆风和开关）：
__CMD__{"type":"schedule","time":"14:30","day":"today","action":"off","temp":26,"fan":"低速","swing":true}

注意事项：
- 指令必须放在回复的最后一行
- 一次只能执行一个指令
- 时间必须是24小时制的HH:MM格式
- 日期只能是 "today" 或 "tomorrow"
- 所有参数必须严格符合规范
- 对于不支持的操作请直接告知用户无法完成

示例对话：
用户："把空调调到制热模式"
助手回复："抱歉，空调系统目前不支持切换模式，我只能帮您调节温度、风速和开关状态。请问需要调整这些设置吗？"

用户："把风速调到自动"
助手回复："抱歉，空调系统只支持低速、中速、高速三档风速调节，不支持自动风速。请选择这三档中的一档。"`;
};

export const getContextPrompt = (currentACState, lifeSuggestions, scheduledTasks) => {
    return `当前空调状态：
温度：${currentACState.temperature}°C
风速：${currentACState.windSpeed}
摆风：${currentACState.sweep}
电源：${currentACState.power}

生活建议：
${lifeSuggestions}

已设置的定时任务：
${scheduledTasks.map((task, index) =>
        `${index + 1}. ${task.day} ${task.time} - ${task.action === 'on' ? '开启' : '关闭'} 
 温度:${task.temperature}°C 风速:${task.fanSpeed}`
    ).join('\n')}`;
};

export const callGLM4API = async (messages, contextPrompt, userMessage) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'glm-4',
                messages: [
                    { role: 'system', content: getSystemPrompt() },
                    ...messages.map(msg => ({
                        role: msg.sender === 'user' ? 'user' : 'assistant',
                        content: msg.text
                    })),
                    { role: 'user', content: contextPrompt + '\n\n' + userMessage }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error calling GLM-4 API:', error);
        return '抱歉，我遇到了一些问题，请稍后再试。';
    }
};
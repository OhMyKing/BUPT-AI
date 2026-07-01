import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

// 生成模拟的脑电数据
const generateEEGData = (addictionLevel = 'medium') => {
    const data = [];
    const multipliers = {
        low: { delta: 0.8, theta: 0.7, alpha: 1.2, beta: 0.9 },
        medium: { delta: 1.0, theta: 1.2, alpha: 0.8, beta: 1.3 },
        high: { delta: 1.2, theta: 1.4, alpha: 0.6, beta: 1.7 }
    };

    const mult = multipliers[addictionLevel];

    for (let i = 0; i < 100; i++) {
        const point = { time: i };

        point.Delta = Math.sin(i * 0.02) * 40 * mult.delta + (Math.random() - 0.5) * 15;
        point.Theta = Math.sin(i * 0.05) * 25 * mult.theta + (Math.random() - 0.5) * 10;
        point.Alpha = Math.sin(i * 0.1) * 30 * mult.alpha + (Math.random() - 0.5) * 8;
        point.Beta = Math.sin(i * 0.2) * 15 * mult.beta + (Math.random() - 0.5) * 5;

        data.push(point);
    }

    return data;
};

// 模拟不同成瘾状况下的指数值
const getAddictionMetrics = (level) => {
    switch(level) {
        case 'low':
            return {
                addictionIndex: 35 + Math.random() * 10,
                attentionScore: 75 + Math.random() * 15,
                viewingDuration: 10 + Math.random() * 5
            };
        case 'medium':
            return {
                addictionIndex: 60 + Math.random() * 10,
                attentionScore: 55 + Math.random() * 15,
                viewingDuration: 25 + Math.random() * 10
            };
        case 'high':
            return {
                addictionIndex: 85 + Math.random() * 10,
                attentionScore: 35 + Math.random() * 15,
                viewingDuration: 45 + Math.random() * 15
            };
        default:
            return {
                addictionIndex: 50,
                attentionScore: 50,
                viewingDuration: 20
            };
    }
};

// 心理咨询建议生成
const generateAdvice = (patientInfo, eegData) => {
    // 根据不同的患者信息和脑电数据生成相应的建议
    const adviceTemplates = {
        low: [
            `根据${patientInfo.name}的脑电数据分析，显示出轻度短视频成瘾特征。注意力分数较高（${Math.round(eegData.attentionScore)}分），表明目前注意力资源尚未受到明显损害。`,
            `建议采取预防性措施，避免成瘾程度加深。可以通过以下方式干预：`,
            `1. 设置日常使用时间限制，建议每日累计使用短视频不超过30分钟`,
            `2. 培养多元兴趣爱好，增加线下社交活动频率`,
            `3. 使用"番茄工作法"等专注力训练方式，每周坚持3-4次`,
            `4. 避免在学习或工作前使用短视频应用，防止注意力分散`,
            `考虑到${patientInfo.name}${patientInfo.age}岁，${patientInfo.gender === '男' ? '他' : '她'}正处于${parseInt(patientInfo.age) < 18 ? '青少年发展关键期' : '成年早期'}，建立健康的媒体使用习惯尤为重要。`,
            `建议每月进行一次随访评估，监测使用情况变化。`
        ],
        medium: [
            `${patientInfo.name}的脑电数据分析显示中度短视频成瘾特征，Beta波活动明显增强（相比基线上升约${Math.round((eegData.addictionIndex - 40) / 40 * 100)}%），Alpha波活动有所降低。`,
            `注意力评分为${Math.round(eegData.attentionScore)}分，处于中等水平，表明注意力资源已受到一定程度影响。日均使用时长约${Math.round(eegData.viewingDuration)}分钟，超出健康使用范围。`,
            `建议采取以下干预措施：`,
            `1. 实施"数字节食"计划，第一周减少25%使用时间，之后逐渐增加至50%`,
            `2. 使用手机管理应用，设置使用时间提醒和强制休息`,
            `3. 每天安排15-20分钟正念冥想练习，帮助恢复注意力资源`,
            `4. 与家人朋友建立"无手机时间"，每天保证2小时高质量线下互动`,
            `5. 每周参与至少3次体育锻炼，每次30分钟以上`,
            `考虑到${patientInfo.name}提到的"${patientInfo.symptoms}"症状，建议增加认知行为疗法（CBT）干预，帮助识别和改变与短视频使用相关的不健康思维模式。`,
            `建议两周进行一次随访，评估干预效果和脑电指标变化。`
        ],
        high: [
            `${patientInfo.name}的脑电数据分析显示严重短视频成瘾特征。Beta脑电波活动显著增强，Alpha波严重抑制，Delta/Theta比值异常，这些指标与重度成瘾高度相关。`,
            `注意力评分仅为${Math.round(eegData.attentionScore)}分，大幅低于健康水平，日均使用时长达${Math.round(eegData.viewingDuration)}分钟，成瘾指数${Math.round(eegData.addictionIndex)}，处于临床干预级别。`,
            `鉴于情况严重性，建议采取综合治疗方案：`,
            `1. 考虑短期（7-10天）的"数字排毒"，在监督下完全暂停使用短视频应用`,
            `2. 安排每周2次专业心理咨询，结合认知行为疗法和接受与承诺疗法（ACT）`,
            `3. 实施脑电生物反馈训练，每周3-4次，增强Alpha波活动，抑制过度的Beta波`,
            `4. 制定严格的时间管理计划，通过渐进式重新引入有限度的短视频使用`,
            `5. 考虑辅助药物治疗评估，特别是针对伴随的"${patientInfo.symptoms}"症状`,
            `6. 家庭干预至关重要，建立支持系统，避免孤立应对`,
            `建议每周进行一次随访评估，监测脑电指标变化和临床症状改善情况。在初期3-4周内，可能需要更频繁的脑电记录以调整治疗方案。`
        ]
    };

    const addictionLevel = eegData.addictionIndex < 45 ? 'low' : (eegData.addictionIndex < 75 ? 'medium' : 'high');
    return adviceTemplates[addictionLevel];
};

// 获取EEG通道颜色
const getChannelColor = (index) => {
    const colors = ['#FF5733', '#33A8FF', '#33FF57', '#D333FF'];
    return colors[index % colors.length];
};

// 脑电通道信息
const EEG_CHANNELS = [
    { name: "Delta", description: "睡眠、深度放松(0.5-4Hz)" },
    { name: "Theta", description: "冥想、迷失、梦境(4-8Hz)" },
    { name: "Alpha", description: "放松但警觉(8-13Hz)" },
    { name: "Beta", description: "活跃思考、专注(13-30Hz)" }
];

const PsychologicalAIAssistant = () => {
    // 状态管理
    const [patientInfo, setPatientInfo] = useState({
        name: '张三',
        age: '19',
        gender: '男',
        education: '大学',
        symptoms: '注意力不集中，焦虑',
        duration: '6个月',
        previousTreatment: '无'
    });

    const [addictionLevel, setAddictionLevel] = useState('medium');
    const [eegData, setEEGData] = useState([]);
    const [metrics, setMetrics] = useState({
        addictionIndex: 60,
        attentionScore: 55,
        viewingDuration: 25
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedAdvice, setGeneratedAdvice] = useState([]);
    const [displayedAdvice, setDisplayedAdvice] = useState([]);
    const adviceRef = useRef(null);

    // 初始化EEG数据
    useEffect(() => {
        setEEGData(generateEEGData(addictionLevel));
        setMetrics(getAddictionMetrics(addictionLevel));
    }, [addictionLevel]);

    // 处理表单变更
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPatientInfo(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 打字机效果函数
    useEffect(() => {
        if (isGenerating && generatedAdvice.length > 0) {
            let currentIndex = 0;
            const timer = setInterval(() => {
                if (currentIndex < generatedAdvice.length) {
                    setDisplayedAdvice(prev => [...prev, generatedAdvice[currentIndex]]);
                    currentIndex++;

                    // 自动滚动到最新内容
                    if (adviceRef.current) {
                        adviceRef.current.scrollTop = adviceRef.current.scrollHeight;
                    }
                } else {
                    setIsGenerating(false);
                    clearInterval(timer);
                }
            }, 800); // 每段文字的间隔时间

            return () => clearInterval(timer);
        }
    }, [isGenerating, generatedAdvice]);

    // 生成咨询建议
    const generateConsultation = () => {
        setDisplayedAdvice([]);
        setIsGenerating(true);
        setGeneratedAdvice(generateAdvice(patientInfo, metrics));
    };

    // 根据成瘾级别获取颜色类
    const getAddictionColorClass = () => {
        if (metrics.addictionIndex < 45) return "text-green-600";
        if (metrics.addictionIndex < 75) return "text-yellow-600";
        return "text-red-600";
    };

    const getAddictionLevelText = () => {
        if (metrics.addictionIndex < 45) return "轻度成瘾";
        if (metrics.addictionIndex < 75) return "中度成瘾";
        return "重度成瘾";
    };

    return (
        <div className="flex h-screen w-full p-2 bg-gray-100 overflow-hidden" style={{width: '100%', height: '100vh', display: 'flex', backgroundColor: '#f3f4f6', overflow: 'hidden'}}>
            {/* 左侧 - 患者信息和脑电数据 */}
            <div className="w-1/2 p-2 space-y-2 overflow-y-auto" style={{width: '50%', padding: '8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px'}}
                {/* 患者信息表单 */}
            <div className="bg-white p-4 rounded-lg shadow-md" style={{backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'}}>
                <h2 className="text-xl font-bold mb-4" style={{fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px'}}>患者信息</h2>

                <div className="grid grid-cols-2 gap-3" style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px'}}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700" style={{display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#4b5563', marginBottom: '4px'}}>姓名</label>
                        <input
                            type="text"
                            name="name"
                            value={patientInfo.name}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            style={{marginTop: '4px', display: 'block', width: '100%', borderRadius: '6px', padding: '8px', border: '1px solid #d1d5db'}}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">年龄</label>
                        <input
                            type="text"
                            name="age"
                            value={patientInfo.age}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">性别</label>
                        <select
                            name="gender"
                            value={patientInfo.gender}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                        >
                            <option value="男">男</option>
                            <option value="女">女</option>
                            <option value="其他">其他</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">教育程度</label>
                        <select
                            name="education"
                            value={patientInfo.education}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                        >
                            <option value="初中及以下">初中及以下</option>
                            <option value="高中">高中</option>
                            <option value="大学">大学</option>
                            <option value="研究生及以上">研究生及以上</option>
                        </select>
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">主要症状</label>
                        <input
                            type="text"
                            name="symptoms"
                            value={patientInfo.symptoms}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">症状持续时间</label>
                        <select
                            name="duration"
                            value={patientInfo.duration}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                        >
                            <option value="1个月内">1个月内</option>
                            <option value="1-3个月">1-3个月</option>
                            <option value="3-6个月">3-6个月</option>
                            <option value="6个月">6个月以上</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">既往治疗情况</label>
                        <select
                            name="previousTreatment"
                            value={patientInfo.previousTreatment}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                        >
                            <option value="无">无</option>
                            <option value="药物治疗">药物治疗</option>
                            <option value="心理咨询">心理咨询</option>
                            <option value="住院治疗">住院治疗</option>
                        </select>
                    </div>
                </div>
            </div>

                {/* 脑电数据部分 */}
            <div className="bg-white p-4 rounded-lg shadow-md" style={{backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'}}>
                <div className="flex justify-between items-center mb-4" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                    <h2 className="text-xl font-bold" style={{fontSize: '1.25rem', fontWeight: 'bold'}}>脑电诊疗数据</h2>
                    <div>
                        <label className="mr-2 text-sm font-medium text-gray-700" style={{marginRight: '8px', fontSize: '0.875rem', fontWeight: '500', color: '#4b5563'}}>成瘾程度:</label>
                        <select
                            value={addictionLevel}
                            onChange={(e) => setAddictionLevel(e.target.value)}
                            className="rounded-md border-gray-300 shadow-sm p-1 border"
                            style={{borderRadius: '6px', padding: '4px', border: '1px solid #d1d5db'}}
                        >
                            <option value="low">轻度</option>
                            <option value="medium">中度</option>
                            <option value="high">重度</option>
                        </select>
                    </div>
                </div>

                {/* 指标概览 */}
                <div className="grid grid-cols-3 gap-2 mb-4" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px'}}>
                    <div className="bg-gray-50 p-2 rounded border" style={{backgroundColor: '#f9fafb', padding: '8px', borderRadius: '4px', border: '1px solid #e5e7eb'}}>
                        <div className="text-sm text-gray-500" style={{fontSize: '0.875rem', color: '#6b7280'}}>成瘾指数</div>
                        <div className={`text-lg font-bold ${getAddictionColorClass()}`} style={{fontSize: '1.125rem', fontWeight: 'bold', color: metrics.addictionIndex < 45 ? '#059669' : (metrics.addictionIndex < 75 ? '#d97706' : '#dc2626')}}>
                            {Math.round(metrics.addictionIndex)}% - {getAddictionLevelText()}
                        </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded border">
                        <div className="text-sm text-gray-500">注意力评分</div>
                        <div className="text-lg font-bold text-blue-600">
                            {Math.round(metrics.attentionScore)}/100
                        </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded border">
                        <div className="text-sm text-gray-500">日均使用时长</div>
                        <div className="text-lg font-bold">
                            {Math.round(metrics.viewingDuration)}分钟
                        </div>
                    </div>
                </div>

                {/* 脑电波形 */}
                <div className="grid grid-cols-2 gap-2">
                    {EEG_CHANNELS.map((channel, index) => (
                        <div key={channel.name} className="mb-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{channel.name}</span>
                                <span className="text-xs text-gray-500">{channel.description}</span>
                            </div>
                            <div className="h-16 bg-gray-50 rounded-lg overflow-hidden">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={eegData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="time" hide={true} />
                                        <YAxis domain={[-60, 60]} hide={true} />
                                        <Line
                                            type="monotone"
                                            dataKey={channel.name}
                                            stroke={getChannelColor(index)}
                                            strokeWidth={2}
                                            dot={false}
                                            isAnimationActive={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

    {/* 右侧 - AI咨询建议 */}
    <div className="w-1/2 p-2 ml-2" style={{width: '50%', padding: '8px', marginLeft: '8px'}}>
        <div className="bg-white p-4 rounded-lg shadow-md h-full flex flex-col" style={{backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)', height: '100%', display: 'flex', flexDirection: 'column'}}
        <div className="flex justify-between items-center mb-4" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
            <h2 className="text-xl font-bold" style={{fontSize: '1.25rem', fontWeight: 'bold'}}>AI心理咨询建议</h2>
            <button
                onClick={generateConsultation}
                disabled={isGenerating}
                className={`px-4 py-2 rounded-lg text-white ${isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    color: 'white',
                    backgroundColor: isGenerating ? '#9ca3af' : '#2563eb',
                    cursor: isGenerating ? 'not-allowed' : 'pointer'
                }}
            >
                {isGenerating ? '生成中...' : '生成咨询建议'}
            </button>
        </div>

            {/* AI输出区域 */}
        <div
            ref={adviceRef}
            className="flex-grow bg-gray-50 rounded-lg p-4 overflow-y-auto font-sans"
            style={{
                flexGrow: 1,
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                padding: '16px',
                overflowY: 'auto',
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
        >
            {displayedAdvice.length === 0 && !isGenerating ? (
                <div className="text-gray-400 italic text-center mt-20" style={{color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', marginTop: '80px'}}>
                    点击"生成咨询建议"按钮获取AI分析和建议
                </div>
            ) : (
                <div className="space-y-4">
                    {displayedAdvice.map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                    {isGenerating && (
                        <div className="flex items-center text-blue-600">
                            <div className="animate-bounce mr-1">●</div>
                            <div className="animate-bounce mr-1" style={{ animationDelay: "0.2s" }}>●</div>
                            <div className="animate-bounce" style={{ animationDelay: "0.4s" }}>●</div>
                        </div>
                    )}
                </div>
            )}
        </div>

            {/* 底部信息 */}
        <div className="mt-2 border-t pt-2 text-xs text-gray-500 flex justify-between"
             style={{
                 marginTop: '8px',
                 borderTop: '1px solid #e5e7eb',
                 paddingTop: '8px',
                 fontSize: '0.75rem',
                 color: '#6b7280',
                 display: 'flex',
                 justifyContent: 'space-between'
             }}>
            <div>模型版本: PsychCare-EEG 2025</div>
            <div>可信度评分: {isGenerating ? '计算中...' : '92%'}</div>
        </div>
    </div>
</div>
</div>
);
};

export default PsychologicalAIAssistant;
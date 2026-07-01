import React from 'react';
import {
    Files,
    FileEdit,
    Copy,
    ClipboardCheck,
    Database,
    BarChart4,
    BookOpen,
    Brain,
    ChevronRight,
    Users,
    GitCompare,
    LineChart,
    Network
} from 'lucide-react';

const Phase = ({ title, icon: Icon, steps, showArrow = true }) => (
    <div className="relative flex-1 min-w-[280px] bg-white rounded-lg shadow-lg p-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-3 rounded-t-lg -mt-4 -mx-4 mb-4">
            <div className="flex items-center justify-center gap-3">
                <Icon className="w-6 h-6" />
                <h3 className="font-bold">{title}</h3>
            </div>
        </div>

        <div className="space-y-4">
            {steps.map((step, index) => (
                <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500 hover:bg-gray-100 transition-colors"
                >
                    {step.icon && <step.icon className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                    <span className="text-sm text-gray-700">{step.text}</span>
                </div>
            ))}
        </div>

        {showArrow && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                <div className="bg-blue-600 rounded-full p-1">
                    <ChevronRight className="w-6 h-6 text-white" />
                </div>
            </div>
        )}
    </div>
);

const ExperimentFlow = () => {
    const phases = [
        {
            title: "构建模板库",
            icon: Files,
            steps: [
                { icon: BookOpen, text: "设计模板" },
                { icon: Brain, text: "ChatGLM4重写" },
                { icon: FileEdit, text: "标记信息" }
            ]
        },
        {
            title: "生成模拟简历",
            icon: Copy,
            steps: [
                { icon: Database, text: "规则组合" },
                { icon: ClipboardCheck, text: "结构保持" },
                { icon: Copy, text: "内容替换" }
            ]
        },
        {
            title: "批量评估",
            icon: BarChart4,
            steps: [
                { icon: Brain, text: "Qwen2.5评分" },
                { icon: LineChart, text: "多维评估" },
                { icon: GitCompare, text: "多次验证" }
            ]
        },
        {
            title: "偏见分析",
            icon: Network,
            steps: [
                { icon: Users, text: "特征配对" },
                { icon: GitCompare, text: "差异分析" },
                { icon: BarChart4, text: "交互效应" }
            ]
        }
    ];

    return (
        <div className="p-8 bg-gray-50">
            <h1 className="text-2xl text-center mb-8 text-gray-800 font-bold">
                基于大语言模型的简历筛选偏见研究流程
            </h1>
            <div className="flex gap-8 overflow-x-auto pb-6 px-4">
                {phases.map((phase, index) => (
                    <Phase
                        key={index}
                        title={phase.title}
                        icon={phase.icon}
                        steps={phase.steps}
                        showArrow={index < phases.length - 1}
                    />
                ))}
            </div>
        </div>
    );
};

export default ExperimentFlow;
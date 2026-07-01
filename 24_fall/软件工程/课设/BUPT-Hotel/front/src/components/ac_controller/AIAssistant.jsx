// src/components/AIAssistant.jsx
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { parseAIResponse } from '@utils/AIutils';
import {callGLM4API, getContextPrompt} from "@/services/AiassistantAPI.jsx";

const AIAssistant = ({
                         currentACState,
                         lifeSuggestions,
                         scheduledTasks,
                         onAdjustAC,
                         onScheduleTask,
                         onDeleteTask
                     }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async () => {
        if (inputMessage.trim() === '') return;

        const userMessage = inputMessage;
        setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
        setInputMessage('');

        const contextPrompt = getContextPrompt(currentACState, lifeSuggestions, scheduledTasks);
        const aiResponse = await callGLM4API(messages, contextPrompt, userMessage);

        const naturalLanguageResponse = parseAIResponse(
            aiResponse,
            onAdjustAC,
            onScheduleTask,
            onDeleteTask,
            currentACState
        );

        setMessages(prev => [...prev, { text: naturalLanguageResponse, sender: 'ai' }]);
    };

    return (
        <div className="flex flex-col bg-white bg-opacity-20 backdrop-blur-lg rounded-3xl p-6 shadow-lg h-full">
            <div className="flex items-center mb-4">
                <MessageSquare className="w-8 h-8 text-white mr-2" />
                <h3 className="text-2xl font-bold text-white">AI助手</h3>
            </div>

            <div className="flex-grow overflow-y-auto mb-4 pr-2 custom-scrollbar">
                {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
                        <div className={`max-w-[70%] p-3 rounded-lg ${
                            message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
                        }`}>
                            {message.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="flex items-center mt-auto">
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="输入您的指令..."
                    className="flex-grow p-2 rounded-full bg-white bg-opacity-50 text-black placeholder-gray-500 focus:outline-none"
                />
                <button
                    onClick={handleSendMessage}
                    className="ml-2 p-2 bg-blue-500 rounded-full text-white hover:bg-blue-600 focus:outline-none"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default AIAssistant;
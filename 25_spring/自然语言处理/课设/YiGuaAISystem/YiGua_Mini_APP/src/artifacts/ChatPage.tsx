import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal, StopCircle, Wrench, Brain, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import { analyzeFortuneData, getAlmanacData } from './tyme-utils';

// LoadingAnimation组件
const LoadingAnimation: React.FC = () => {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '300ms' }}></div>
      <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '600ms' }}></div>
    </div>
  );
};

// API配置
const APP_KEY = '';
const API_URL = '';

// 类型定义
interface ChatPageProps {
  setCurrentPage: (page: string) => void;
  userInfo: any;
  initialQuestion?: string;
}

interface AgentThought {
  id: string;
  position: number;
  thought: string;
  observation: string;
  tool: string;
  tool_input: string;
  message_files?: string[];
  created_at: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: number;
  message_id?: string;
  files?: {
    id: string;
    url: string;
    type: string;
  }[];
  isLoading?: boolean;
  isHidden?: boolean;
  agentThoughts?: AgentThought[]; // 新增：Agent思考过程
  isAgent?: boolean; // 新增：是否是Agent消息
}

interface SuggestedQuestion {
  id: string;
  content: string;
}

// Agent思考过程展示组件
const AgentThoughtDisplay: React.FC<{ thought: AgentThought }> = ({ thought }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 解析工具输入
  const parseToolInput = (input: string) => {
    try {
      return JSON.parse(input);
    } catch {
      return input;
    }
  };
  
  return (
    <div className="border-l-2 border-blue-300 pl-3 ml-2 my-2 overflow-hidden">
      <div 
        className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-800 flex-wrap"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <Brain size={16} className="text-blue-500" />
        <span className="font-medium">步骤 {thought.position}</span>
      </div>
      
      {isExpanded && (
        <div className="mt-2 space-y-2 text-sm overflow-hidden">
          {thought.thought && (
            <div className="bg-blue-50 p-2 rounded overflow-hidden">
              <div className="font-medium text-blue-700 mb-1">思考：</div>
              <div className="text-gray-700 break-words">{thought.thought}</div>
            </div>
          )}
          
          {thought.tool_input && thought.tool_input !== '{}' && (
            <div className="bg-white-50 p-2 rounded overflow-hidden">
              <div className="font-medium text-white-700 mb-1">工具输入：</div>
              <div className="overflow-x-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words" style={{ wordBreak: 'break-word' }}>
                  {JSON.stringify(parseToolInput(thought.tool_input), null, 2)}
                </pre>
              </div>
            </div>
          )}
          
          {thought.observation && (
            <div className="bg-grey-50 p-2 rounded overflow-hidden">
              <div className="font-medium text-grey-700 mb-1">观察结果：</div>
              <div className="text-gray-700 break-words">{thought.observation}</div>
            </div>
          )}
          
          {thought.message_files && thought.message_files.length > 0 && (
            <div className="flex items-center gap-2 text-gray-600">
              <FileText size={16} />
              <span>生成了 {thought.message_files.length} 个文件</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 自定义Markdown渲染组件
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />
          ),
          code: ({ node, inline, className, children, ...props }) => {
            if (inline) {
              return (
                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <div className="relative my-2">
                <pre className="bg-gray-50 rounded-lg p-3 overflow-x-auto text-sm font-mono">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          h1: ({ node, children, ...props }) => (
            <h1 className="text-xl font-bold my-3" {...props}>
              {children}
            </h1>
          ),
          h2: ({ node, children, ...props }) => (
            <h2 className="text-lg font-bold my-2" {...props}>
              {children}
            </h2>
          ),
          h3: ({ node, children, ...props }) => (
            <h3 className="text-md font-bold my-2" {...props}>
              {children}
            </h3>
          ),
          ul: ({ node, ordered, ...props }) => (
            <ul className="list-disc pl-6 my-2" {...props} />
          ),
          ol: ({ node, ordered, ...props }) => (
            <ol className="list-decimal pl-6 my-2" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-gray-200 border" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-50" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r last:border-r-0" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-3 py-2 border-t border-r last:border-r-0" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-gray-200 pl-4 my-2 italic text-gray-600" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

const ChatPage: React.FC<ChatPageProps> = ({ setCurrentPage, userInfo, initialQuestion }) => {
  // 状态管理
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [initialQuestionSent, setInitialQuestionSent] = useState(false);
  const [systemMessageSent, setSystemMessageSent] = useState(false);
  const [currentAgentThoughts, setCurrentAgentThoughts] = useState<Map<string, AgentThought>>(new Map()); // 临时存储agent thoughts

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const todayAlmanac = getAlmanacData(new Date());
  const todayFortune = analyzeFortuneData(userInfo, new Date());

  // 准备系统消息，格式化用户信息
  const formatUserInfoMessage = () => {
    if (!userInfo) return null;
    
    if (!userInfo.name || !userInfo.gender || !userInfo.birthYear || 
        !userInfo.birthMonth || !userInfo.birthDay || !userInfo.birthHour) {
      return null;
    }
    
    const getChineseZodiacHour = (hourStr: string) => {
      const hourMap: {[key: string]: string} = {
        '未知': '未知',
        '子时(23-1点)': '子时 (23:00-01:00)',
        '丑时(1-3点)': '丑时 (01:00-03:00)',
        '寅时(3-5点)': '寅时 (03:00-05:00)',
        '卯时(5-7点)': '卯时 (05:00-07:00)',
        '辰时(7-9点)': '辰时 (07:00-09:00)',
        '巳时(9-11点)': '巳时 (09:00-11:00)',
        '午时(11-13点)': '午时 (11:00-13:00)',
        '未时(13-15点)': '未时 (13:00-15:00)',
        '申时(15-17点)': '申时 (15:00-17:00)',
        '酉时(17-19点)': '酉时 (17:00-19:00)',
        '戌时(19-21点)': '戌时 (19:00-21:00)',
        '亥时(21-23点)': '亥时 (21:00-23:00)',
      };
      
      return hourMap[hourStr] || hourStr;
    };
    
  return `【用户信息】
  姓名: ${userInfo.name}
  性别: ${userInfo.gender}
  出生日期: ${userInfo.birthYear}年${userInfo.birthMonth}月${userInfo.birthDay}日
  出生时辰: ${getChineseZodiacHour(userInfo.birthHour)}

  【今日信息】
  今日: ${todayAlmanac.solar}
  农历: ${todayAlmanac.lunar}
  干支: ${todayAlmanac.gz}

  【宜】
  ${todayAlmanac.yi.join('、')}

  【忌】
  ${todayAlmanac.ji.join('、')}

  【吉神宜趋】
  ${todayAlmanac.auspicious.join('、')}

  【凶神宜忌】
  ${todayAlmanac.inauspicious.join('、')}

  【今日运势】
  ${todayFortune ? todayFortune.fortuneDescription : '暂无运势分析'}

  请基于以上信息为用户提供更加个性化的命理解析和八字分析。在回答时，避免直接以对方姓名称呼，并在内容中恰当地参考其生辰八字信息，但不需要在每次回答中重复用户的基本信息。`;
  };

  // 初始化系统消息
  useEffect(() => {
    if (isFirstLoad && userInfo) {
      setIsFirstLoad(false);
      
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `欢迎您，${userInfo?.name || '贵客'}！云游四海，参悟天机，贫道乃秉承先贤之法，精研《周易》《易经》数十载，今日与道友有缘相遇，实乃天意。 \n\n贫道精通**六爻预测**之术，可为道友解卦测事，明晰天机。请道友道明心中所求，贫道这便起卦推演，为道友指明前路。`,
        created_at: Date.now(),
      };
      
      const userInfoMessage = formatUserInfoMessage();
      const initialMessages = [welcomeMessage];
      
      if (userInfoMessage) {
        const systemMessage: Message = {
          id: 'system-info',
          role: 'assistant',
          content: userInfoMessage,
          created_at: Date.now(),
          isHidden: true
        };
        initialMessages.push(systemMessage);
        setSystemMessageSent(true);
      }
      
      setMessages(initialMessages);
      
      setSuggestedQuestions([
        { id: '1', content: '我的八字命盘分析是什么？' },
        { id: '2', content: '今天适合做什么事情？' },
        { id: '3', content: '如何解读六爻卦象？' },
        { id: '4', content: '我的事业运势如何？' }
      ]);
    }
  }, [isFirstLoad, userInfo]);

  // 当有初始问题时，自动发送
  useEffect(() => {
    if (!isFirstLoad && initialQuestion && !initialQuestionSent && messages.length > 0) {
      setInitialQuestionSent(true);
      sendMessage(initialQuestion);
    }
  }, [isFirstLoad, initialQuestion, initialQuestionSent, messages]);

  // 发送消息到API
  const sendMessage = async (content: string) => {
    if (!content.trim() && uploadedFiles.length === 0) return;

    const isFirstUserMessage = !messages.some(msg => msg.role === 'user');
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content,
      created_at: Date.now(),
      files: uploadedFiles.length > 0 ? uploadedFiles : undefined
    };

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      created_at: Date.now(),
      isLoading: true,
      agentThoughts: [] // 初始化agent thoughts数组
    };

    setMessages([...messages, userMessage, assistantMessage]);
    setInputValue('');
    setUploadedFiles([]);
    setSuggestedQuestions([]);
    setCurrentAgentThoughts(new Map()); // 重置临时agent thoughts存储

    try {
      let apiQueryContent = content;
      
      if (isFirstUserMessage && userInfo) {
        const userInfoMessage = formatUserInfoMessage();
        if (userInfoMessage) {
          apiQueryContent = `${userInfoMessage}\n\n用户查询: ${content}`;
          setSystemMessageSent(true);
        }
      }

      const requestBody: any = {
        query: apiQueryContent,
        user: userInfo?.name || 'guest',
        inputs: {},
        response_mode: 'streaming',
        conversation_id: conversationId,
        files: uploadedFiles.map(file => ({
          type: 'image',
          transfer_method: 'remote_url',
          url: file.url
        }))
      };

      setIsStreaming(true);

      const response = await fetch(`${API_URL}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${APP_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('Response body reader could not be created');
      }

      let done = false;
      let buffer = '';
      let currentMessageId = '';
      let messageContent = '';
      let firstChunkReceived = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          if (event.startsWith('data: ')) {
            try {
              const data = JSON.parse(event.slice(5));
              // console.log('API Response Data:', data)

              // 处理Agent思考事件
              if (data.event === 'agent_thought') {
                const thought: AgentThought = {
                  id: data.id,
                  position: data.position,
                  thought: data.thought || '',
                  observation: data.observation || '',
                  tool: data.tool || '',
                  tool_input: data.tool_input || '',
                  message_files: data.message_files || [],
                  created_at: data.created_at
                };
                
                // 更新临时存储并同时更新消息
                setCurrentAgentThoughts(prev => {
                  const updated = new Map(prev);
                  updated.set(thought.id, thought);
                  
                  // 同步更新消息中的agent thoughts
                  setMessages(prevMessages => {
                    const updatedMessages = [...prevMessages];
                    const lastMessage = updatedMessages[updatedMessages.length - 1];
                    if (lastMessage.role === 'assistant') {
                      lastMessage.isAgent = true;
                      // 从更新后的Map创建数组
                      lastMessage.agentThoughts = Array.from(updated.values())
                        .sort((a, b) => a.position - b.position);
                    }
                    return updatedMessages;
                  });
                  
                  return updated;
                });
              }
              
              // 处理Agent消息事件
              else if (data.event === 'agent_message') {
                if (!firstChunkReceived) {
                  firstChunkReceived = true;
                  setMessages(prev => {
                    const updated = [...prev];
                    const lastMessage = updated[updated.length - 1];
                    if (lastMessage.role === 'assistant' && lastMessage.isLoading) {
                      lastMessage.isLoading = false;
                      lastMessage.isAgent = true;
                    }
                    return updated;
                  });
                }
                
                if (data.message_id) {
                  if (currentMessageId === '') {
                    currentMessageId = data.message_id;
                    messageContent = data.answer || '';
                  } else if (currentMessageId === data.message_id) {
                    messageContent += data.answer || '';
                  }
                  
                  setMessages(prev => {
                    const updated = [...prev];
                    const lastMessage = updated[updated.length - 1];
                    if (lastMessage.role === 'assistant') {
                      lastMessage.content = messageContent;
                    }
                    return updated;
                  });
                }
              }
              
              // 处理普通消息事件
              else if (data.event === 'message') {
                if (!firstChunkReceived) {
                  firstChunkReceived = true;
                  setMessages(prev => {
                    const updated = [...prev];
                    const lastMessage = updated[updated.length - 1];
                    if (lastMessage.role === 'assistant' && lastMessage.isLoading) {
                      lastMessage.isLoading = false;
                    }
                    return updated;
                  });
                }
                
                if (data.message_id) {
                  if (currentMessageId === '') {
                    currentMessageId = data.message_id;
                    messageContent = data.answer || '';
                  } else if (currentMessageId === data.message_id) {
                    messageContent += data.answer || '';
                  }
                  
                  setMessages(prev => {
                    const updated = [...prev];
                    const lastMessage = updated[updated.length - 1];
                    if (lastMessage.role === 'assistant') {
                      lastMessage.content = messageContent;
                    }
                    return updated;
                  });
                }
              }
              
              else if (data.event === 'message_end') {
                setIsStreaming(false);
                setCurrentTaskId(null);
                currentMessageId = '';
                setCurrentAgentThoughts(new Map());
                if (data.conversation_id) {
                  setConversationId(data.conversation_id);
                  fetchSuggestedQuestions(data.message_id);
                }
              }
              
              else if (data.event === 'message_file') {
                setMessages(prev => {
                  const updated = [...prev];
                  const lastMessage = updated[updated.length - 1];
                  if (lastMessage.role === 'assistant') {
                    if (!lastMessage.files) {
                      lastMessage.files = [];
                    }
                    lastMessage.files.push({
                      id: data.id,
                      url: data.url,
                      type: data.type
                    });
                  }
                  return updated;
                });
              }
              
              else if (data.event === 'error') {
                console.error('Error in stream:', data);
                setIsStreaming(false);
                setCurrentTaskId(null);
                currentMessageId = '';
                
                setMessages(prev => {
                  const updated = [...prev];
                  const lastMessage = updated[updated.length - 1];
                  if (lastMessage.role === 'assistant') {
                    lastMessage.isLoading = false;
                    lastMessage.content += '\n\n> [!ERROR] 发生错误，请稍后再试';
                  }
                  return updated;
                });
              }

              if (data.task_id && !currentTaskId) {
                setCurrentTaskId(data.task_id);
              }
              
              if (data.message_id) {
                setMessages(prev => {
                  const updated = [...prev];
                  const lastMessage = updated[updated.length - 1];
                  if (lastMessage.role === 'assistant' && !lastMessage.message_id) {
                    lastMessage.message_id = data.message_id;
                  }
                  return updated;
                });
              }
            } catch (e) {
              console.error('Error parsing event data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsStreaming(false);
      setCurrentTaskId(null);
      
      setMessages(prev => {
        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.isLoading = false;
          lastMessage.content += '\n\n> [!ERROR] 发生错误，请稍后再试';
        }
        return updated;
      });
    }
  };

  // 停止当前响应
  const stopResponse = async () => {
    if (!currentTaskId) return;

    try {
      await fetch(`${API_URL}/chat-messages/${currentTaskId}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${APP_KEY}`
        },
        body: JSON.stringify({
          user: userInfo?.name || 'guest'
        })
      });

      setIsStreaming(false);
      setCurrentTaskId(null);
      
      setMessages(prev => {
        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];
        if (lastMessage.role === 'assistant' && lastMessage.isLoading) {
          lastMessage.isLoading = false;
        }
        return updated;
      });
    } catch (error) {
      console.error('Error stopping response:', error);
    }
  };

  // 获取建议问题
  const fetchSuggestedQuestions = async (messageId: string) => {
    try {
      const response = await fetch(`${API_URL}/messages/${messageId}/suggested?user=${userInfo?.name || 'guest'}`, {
        headers: {
          'Authorization': `Bearer ${APP_KEY}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.suggested_questions && data.suggested_questions.length > 0) {
          setSuggestedQuestions(data.suggested_questions.map((q: string, i: number) => ({
            id: `suggested-${i}`,
            content: q
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching suggested questions:', error);
    }
  };

  // 处理建议问题点击
  const handleSuggestedQuestionClick = (question: string) => {
    setInputValue(question);
    sendMessage(question);
  };

  // 格式化时间戳
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 全局样式 */}
      <style jsx>{`
        .markdown-content p {
          margin-bottom: 0.75rem;
        }
        
        .markdown-content hr {
          margin: 1rem 0;
          border-top: 1px solid #e5e7eb;
        }
        
        .markdown-content strong {
          font-weight: 600;
        }
        
        .markdown-content em {
          font-style: italic;
        }
        
        .markdown-content img {
          max-width: 100%;
          border-radius: 0.375rem;
          margin: 0.5rem 0;
        }
        
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* 聊天历史区域 */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 no-scrollbar"
        style={{ 
          paddingBottom: '0px',
        }}
      >
        <div style={{ height: '3vh' }}></div>
        {messages.filter(message => !message.isHidden).map((message, index) => (
          <div 
            key={message.id} 
            className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user' 
                  ? 'bg-blue-50 border border-blue-100 text-gray-800' 
                  : 'paper-card bg-white text-gray-700'
              }`}
            >
              <div className="text-sm mb-1 text-gray-500 flex items-center gap-2">
                {message.role === 'user' ? '我' : '易卦'} · {formatTime(message.created_at)}
              </div>
              
              {/* 展示Agent思考过程 */}
              {message.agentThoughts && message.agentThoughts.length > 0 && (
                <div className="mb-3 bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Brain size={16} />
                    推理过程
                  </div>
                  {message.agentThoughts.map(thought => (
                    <AgentThoughtDisplay key={thought.id} thought={thought} />
                  ))}
                </div>
              )}
              
              <div className={message.role === 'user' ? 'whitespace-pre-wrap' : ''}>
                {message.isLoading ? (
                  <div className="py-2">
                    <LoadingAnimation />
                  </div>
                ) : (
                  message.role === 'assistant' ? (
                    <MarkdownRenderer content={message.content} />
                  ) : (
                    message.content
                  )
                )}
              </div>
              
              {message.files && message.files.length > 0 && (
                <div className="mt-2">
                  {message.files.map(file => (
                    <div key={file.id} className="mt-1">
                      {file.type.startsWith('image/') && (
                        <img 
                          src={file.url} 
                          alt="上传的图片" 
                          className="max-w-full rounded-lg max-h-60"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div style={{ height: '10vh' }}></div>
      </div>

      {/* 底部固定区域 */}
      <div className="fixed bottom-16 left-0 right-0 w-full bg-white border-t border-gray-200">
        {/* 建议问题 */}
        {suggestedQuestions.length > 0 && !isStreaming && (
          <div className="px-2 sm:px-4 py-2 bg-white">
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map(question => (
                <button
                  key={question.id}
                  className="text-sm bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1 text-gray-700 transition-colors duration-200"
                  onClick={() => handleSuggestedQuestionClick(question.content)}
                >
                  {question.content}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 输入区域 */}
        <div className="p-2 sm:p-4 pb-safe">
            <div className="flex items-center bg-gray-100 rounded-full pr-2 pl-3 py-2">
              <input
                type="text"
                className="flex-1 min-w-0 bg-transparent border-none focus:outline-none py-1"
                placeholder="输入问题..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isStreaming) {
                    sendMessage(inputValue);
                  }
                }}
                disabled={isStreaming}
              />
              <div className="flex-shrink-0 ml-1">
                {isStreaming ? (
                  <button
                    className="text-red-500 hover:text-red-700 p-1 transition-colors duration-200"
                    onClick={stopResponse}
                  >
                    <StopCircle size={22} />
                  </button>
                ) : (
                  <button
                    className={`p-1 transition-colors duration-200 ${
                      !inputValue.trim() && uploadedFiles.length === 0
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-blue-500 hover:text-blue-700'
                    }`}
                    onClick={() => sendMessage(inputValue)}
                    disabled={!inputValue.trim() && uploadedFiles.length === 0}
                  >
                    <SendHorizontal size={22} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default ChatPage;
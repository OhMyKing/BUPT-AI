import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileImage, Scan, PaintBucket, Video, Trash2, Download, X, ArrowRight, ChevronDown, ChevronUp, HelpCircle, Play } from 'lucide-react';
import ShadowPuppetry from './images/ShadowPuppetry.png'
import Logo from './images/logo.png'

// 主题颜色 - 保持中国传统色彩，但稍微现代化
// const theme = {
//   background: '#f8f2e0', // 更明亮的泛黄纸张颜色
//   primary: '#8c6d46',    // 木质棕色
//   secondary: '#c8a675',  // 浅棕色
//   text: '#4a3520',       // 深褐色文字
//   border: '#d3b78f',     // 边框颜色
//   highlight: '#c93e00',  // 更鲜明的中国红
//   shadow: 'rgba(0, 0, 0, 0.12)',
//   overlay: 'rgba(74, 53, 32, 0.75)',
//   cardBackground: 'rgba(255, 255, 255, 0.9)',
// };

const GlobalStyles = () => (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@400;500;600;700&display=swap');
    
    body {
      font-family: 'Noto Serif SC', serif;
      background-color: #f9f7f0;
      color: #333;
    }
    
    h1, h2, h3, .title-font {
      font-family: 'Ma Shan Zheng', cursive;
    }
    
    /* 传统纸质感 */
    .paper-card {
      background-color: #fff;
      border: 1px solid #e8e0d0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    /* 卦象线条样式 */
    .yang-line {
      height: 3px;
      background: #333;
    }
    
    .yin-line-part {
      height: 3px;
      background: #333;
    }
    
    /* 导航样式 */
    .nav-bar {
      background-color: #c06b5a;
      color: white;
    }
    
    /* 主题色按钮 */
    .primary-btn {
      background-color: #c06b5a;
      color: white;
    }
    
    /* 次要按钮 */
    .secondary-btn {
      background-color: #c69063;
      color: white;
    }
    
    /* 为聊天页面添加禁止滚动样式 */
    .no-scroll {
      overflow: hidden;
      position: fixed;
      width: 100%;
      height: 100%;
    }
  `}</style>
);
const API_BASE_URL = 'http://127.0.0.1:5001';

// 主应用组件
export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [showTips, setShowTips] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);

  // 在组件加载时获取所有项目
  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/projects`);
        const data = await response.json();
        
        if (data.status === 'success') {
          setProjects(data.projects);
          
          // 如果有项目，默认选择第一个
          if (data.projects.length > 0) {
            setCurrentProject(data.projects[0]);
            
            // 设置当前步骤
            const project = data.projects[0];
            if (project.videos && project.videos.length > 0) {
              setCurrentStep(4);
            } else if (project.assets) {
              setCurrentStep(3);
            } else if (project.detections) {
              setCurrentStep(2);
            } else {
              setCurrentStep(1);
            }
          }
        }
        
        // 设置加载完成
        setTimeout(() => {
          setFirstLoad(false);
        }, 3500); // 展示加载动画3.5秒
        
      } catch (err) {
        console.error('获取项目列表失败:', err);
        setError('获取项目列表失败: ' + err.message);
        setFirstLoad(false);
      } finally {
        setLoadingProjects(false);
      }
    };
    
    fetchProjects();
  }, []);

  // 创建新项目
  const createNewProject = (imageId, filename, imageUrl) => {
    const newProject = {
      id: imageId,
      name: filename,
      imageUrl,
      createdAt: new Date().toLocaleString(),
      detections: null,
      assets: null,
      videos: [],
    };
    setProjects([newProject, ...projects]);
    setCurrentProject(newProject);
  };

  // 更新当前项目
  const updateCurrentProject = (data) => {
    const updatedProject = { ...currentProject, ...data };
    setCurrentProject(updatedProject);
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  // 选择已有项目
  const selectProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      
      // 确定应该跳转到哪一步
      if (project.videos && project.videos.length > 0) {
        setCurrentStep(4);
      } else if (project.assets) {
        setCurrentStep(3);
      } else if (project.detections) {
        setCurrentStep(2);
      } else {
        setCurrentStep(1);
      }
      
      // 在移动设备上选择项目后关闭侧边栏
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    }
  };
  
  // 处理新建项目
  const handleNewProject = () => {
    setCurrentProject(null);
    setCurrentStep(1);
    
    // 在移动设备上点击新建项目后关闭侧边栏
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };
  
  // 删除项目
  const deleteProject = async (projectId) => {
    setDeletingProject(projectId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // 从项目列表中移除
        const updatedProjects = projects.filter(p => p.id !== projectId);
        setProjects(updatedProjects);
        
        // 如果删除的是当前项目，则重置当前项目
        if (currentProject && currentProject.id === projectId) {
          if (updatedProjects.length > 0) {
            selectProject(updatedProjects[0].id);
          } else {
            setCurrentProject(null);
            setCurrentStep(1);
          }
        }
        
        // 关闭确认对话框
        setConfirmDelete(null);
      } else {
        setError('删除项目失败: ' + (data.message || '未知错误'));
      }
    } catch (err) {
      setError('删除项目请求失败: ' + err.message);
    } finally {
      setDeletingProject(null);
    }
  };

  // 关闭小贴士
  const closeTips = () => {
    setShowTips(false);
  };

  // 切换侧边栏显示
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (firstLoad) {
    return <SplashScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f2e0] text-[#4a3520] font-serif relative">
      <GlobalStyles />
      {/* 头部导航栏 */}
      <Header 
        currentStep={currentStep} 
        setCurrentStep={setCurrentStep} 
        currentProject={currentProject}
        toggleSidebar={toggleSidebar}
        sidebarOpen={sidebarOpen}
      />
      
      <div className="flex flex-1 relative overflow-hidden">
        {/* 左侧项目列表 */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 20 }}
              className="w-[280px] bg-[#c8a675] border-r border-[#d3b78f] shadow-md z-10 flex-shrink-0 
                      md:relative fixed h-full md:h-auto"
            >
              <LeftSidebar 
                projects={projects} 
                currentProject={currentProject} 
                selectProject={selectProject}
                setConfirmDelete={setConfirmDelete}
                loadingProjects={loadingProjects}
                handleNewProject={handleNewProject}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 主内容区域 */}
        <motion.div 
          className="flex-1 p-4 overflow-y-auto overflow-x-hidden relative"
          animate={{ 
            marginLeft: sidebarOpen && window.innerWidth >= 768 ? "0px" : "0px",
            width: "100%" 
          }}
        >
          {/* 操作小贴士 */}
          <AnimatePresence>
            {showTips && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-[#fcf9ef] border border-[#d3b78f] rounded-lg p-4 mb-4 relative shadow-sm"
              >
                <button 
                  onClick={closeTips}
                  className="absolute top-2 right-2 text-[#8c6d46] hover:text-[#c93e00] transition-colors"
                >
                  <X size={16} />
                </button>
                <div className="flex items-start">
                  <div className="mr-3 mt-1 text-[#c93e00]">
                    <HelpCircle size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm mb-1">操作小贴士</h3>
                    <p className="text-sm text-[#4a3520]/80">
                      {!currentProject && currentStep === 1 && "上传一张中国古画图像，开始您的创作之旅。支持拖放或点击上传。"}
                      {currentProject && currentStep === 1 && "您已选择一个项目。若要创建新项目，请点击左侧「新建项目」按钮。"}
                      {currentStep === 2 && "调整置信度阈值以精确检测画中人物。检测完成后，继续获取图像资产。"}
                      {currentStep === 3 && "查看提取出的人物和背景资产。点击人物以获取其动画资产，或下载资产供其他软件使用。"}
                      {currentStep === 4 && "为选中的人物生成动画。在右侧调整参数，输入提示词描述你希望的动作效果。"}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {error && (
            <ErrorModal error={error} setError={setError} />
          )}
          
          {/* 删除确认对话框 */}
          <AnimatePresence>
            {confirmDelete && (
              <ConfirmDeleteModal 
                confirmDelete={confirmDelete}
                setConfirmDelete={setConfirmDelete}
                deleteProject={deleteProject}
                deletingProject={deletingProject}
              />
            )}
          </AnimatePresence>
          
          {/* 根据当前步骤显示不同内容 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {currentStep === 1 && (
                <Step1Upload 
                  createNewProject={createNewProject}
                  setError={setError}
                  setCurrentStep={setCurrentStep}
                  currentProject={currentProject}
                />
              )}
              
              {currentStep === 2 && currentProject && (
                <Step2Detect 
                  currentProject={currentProject}
                  updateCurrentProject={updateCurrentProject}
                  setError={setError}
                  setCurrentStep={setCurrentStep}
                />
              )}
              
              {currentStep === 3 && currentProject && (
                <Step3Assets 
                  currentProject={currentProject}
                  updateCurrentProject={updateCurrentProject}
                  setError={setError}
                  setCurrentStep={setCurrentStep}
                  setSelectedCharacterId={setSelectedCharacterId}
                />
              )}
              
              {currentStep === 4 && currentProject && (
                <div className="flex flex-col lg:flex-row gap-4">
                  <Step4Animate 
                    currentProject={currentProject}
                    selectedCharacterId={selectedCharacterId}
                    updateCurrentProject={updateCurrentProject}
                    setError={setError}
                    setCurrentStep={setCurrentStep}
                  />
                  <RightSidebar 
                    currentProject={currentProject}
                    selectedCharacterId={selectedCharacterId}
                    updateCurrentProject={updateCurrentProject}
                    setError={setError}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

// 启动屏幕
function SplashScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden">
      <GlobalStyles></GlobalStyles>
      
      {/* 背景图片 */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-60"
        style={{ 
          backgroundImage: `url(${ShadowPuppetry})`,
          filter: "blur(3px)"
        }}
      ></div>
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="text-center relative z-10"
      >
        <h1 className="text-8xl font-bold mb-2 text-[#c93e00] drop-shadow-lg">皮影戏</h1>
        <h2 className="text-xl text-[#8c6d46]">古画人物动画生成</h2>
      </motion.div>
      
      <motion.div 
        className="mt-8 w-16 h-16 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div 
          className="w-full h-full border-4 border-[#c93e00] border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
    </div>
  );
}


// 错误模态框
function ErrorModal({ error, setError }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={() => setError(null)}
    >
      <motion.div 
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white rounded-lg p-6 max-w-md w-[90%] shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start mb-4">
          <div className="mr-3 text-red-500 mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">操作出错</h3>
            <p className="mt-1 text-gray-700">{error}</p>
          </div>
        </div>
        <div className="flex justify-end">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-[#8c6d46] text-white rounded-md hover:bg-[#c93e00] transition-colors"
            onClick={() => setError(null)}
          >
            关闭
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// 删除确认模态框
function ConfirmDeleteModal({ confirmDelete, setConfirmDelete, deleteProject, deletingProject }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={() => !deletingProject && setConfirmDelete(null)}
    >
      <motion.div 
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white rounded-lg p-6 max-w-md w-[90%] shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-500 mb-4">
            <Trash2 size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">确认删除</h3>
          <p className="mt-2 text-gray-700">
            您确定要删除项目 "{confirmDelete.name}" 吗？此操作无法撤销。
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            onClick={() => setConfirmDelete(null)}
            disabled={deletingProject === confirmDelete.id}
          >
            取消
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center"
            onClick={() => deleteProject(confirmDelete.id)}
            disabled={deletingProject === confirmDelete.id}
          >
            {deletingProject === confirmDelete.id ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                删除中...
              </>
            ) : (
              <>删除</>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// 头部组件
function Header({ currentStep, setCurrentStep, currentProject, toggleSidebar, sidebarOpen }) {
  const steps = [
    { number: 1, title: '上传图像', icon: <Upload size={16} /> },
    { number: 2, title: '检测人物', icon: <Scan size={16} /> },
    { number: 3, title: '获取图像资产', icon: <PaintBucket size={16} /> },
    { number: 4, title: '获取动画资产', icon: <Video size={16} /> },
  ];

  const handleStepClick = (stepNumber) => {
    // 如果有当前项目，则步骤1不可点击（只有在新建项目时才能进入步骤1）
    if (currentProject && stepNumber === 1) {
      return; // 已有项目不能进入上传步骤
    }
    
    // 判断哪些步骤已经完成
    const completedSteps = [];
    
    // 步骤1：有项目就表示完成
    if (currentProject) {
      completedSteps.push(1);
    }
    
    // 步骤2：有检测结果就表示完成
    if (currentProject && currentProject.detections) {
      completedSteps.push(2);
    }
    
    // 步骤3：有资产就表示完成
    if (currentProject && currentProject.assets) {
      completedSteps.push(3);
    }
    
    // 步骤4：可以进入（如果有资产）
    if (currentProject && currentProject.assets) {
      completedSteps.push(4);
    }
    
    // 允许点击已完成的步骤
    if (completedSteps.includes(stepNumber)) {
      setCurrentStep(stepNumber);
    }
  };

  return (
    <header className="bg-[#c8a675] border-b border-[#d3b78f] shadow-sm">
      <div className="container mx-auto px-0 py-3">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="mr-3 md:hidden text-[#4a3520] hover:text-[#c93e00] transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <ChevronRight size={20} />}
          </button>
          
          <div className="flex items-center mr-6">
          <img 
            src={Logo}
            alt="Logo" 
            className="mr-3"
            style={{ height: '5vh' }}
          />
            <h1 className="text-4xl font-bold text-[#c93e00] mr-2">皮影戏</h1>
          </div>
          
          <div className="flex-1 overflow-x-auto hide-scrollbar">
            <div className="flex items-center min-w-max">
              {steps.map((step, index) => {
                const isActive = step.number === currentStep;
                const isCompleted = step.number < currentStep;
                const isDisabled = currentProject && step.number === 1;
                
                return (
                  <div 
                    key={step.number} 
                    className={`flex items-center ${index > 0 ? 'ml-1 sm:ml-3' : ''}`}
                  >
                    <motion.div 
                      className={`
                        flex items-center px-2 py-1 sm:px-3 sm:py-1.5 rounded-md transition-colors
                        ${isActive ? 'bg-[#c93e00] text-white' : 
                          isCompleted && !isDisabled ? 'bg-[#8c6d46]/20 text-[#8c6d46] hover:bg-[#8c6d46]/30 cursor-pointer' : 
                          isDisabled ? 'bg-[#d3b78f]/20 text-[#4a3520]/40 cursor-not-allowed' :
                          'bg-[#d3b78f]/40 text-[#4a3520]/60 cursor-default'}
                      `}
                      onClick={() => handleStepClick(step.number)}
                      whileHover={isCompleted && !isDisabled ? { scale: 1.03 } : {}}
                      whileTap={isCompleted && !isDisabled ? { scale: 0.98 } : {}}
                    >
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 mr-1.5 text-xs">
                        {step.number}
                      </span>
                      <span className="hidden xs:flex items-center">
                        <span className="mr-1.5">{step.icon}</span>
                        <span className="text-sm whitespace-nowrap">{step.title}</span>
                      </span>
                    </motion.div>
                    
                    {index < steps.length - 1 && (
                      <div className="w-3 sm:w-5 h-0.5 bg-[#d3b78f] mx-1"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {currentProject && (
            <div className="ml-4 hidden sm:block">
              <p className="text-sm truncate max-w-[150px]">
                当前: <span className="font-semibold">{currentProject.name}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// 左侧边栏组件
function LeftSidebar({ projects, currentProject, selectProject, setConfirmDelete, loadingProjects, handleNewProject }) {
  const [collapsed, setCollapsed] = useState({});
  
  // 分组项目（按日期）
  const groupedProjects = projects.reduce((groups, project) => {
    const date = project.createdAt.split(' ')[0]; // 提取日期部分
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(project);
    return groups;
  }, {});
  
  // 处理删除按钮点击事件
  const handleDeleteClick = (e, project) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发项目选择
    setConfirmDelete(project);
  };
  
  // 切换分组折叠状态
  const toggleGroup = (date) => {
    setCollapsed({
      ...collapsed,
      [date]: !collapsed[date]
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[#d3b78f]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#4a3520]">项目列表</h3>
          <motion.button
            className="flex items-center px-3 py-1.5 bg-[#c93e00] text-white rounded-full text-sm font-medium"
            onClick={handleNewProject}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="mr-1.5" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            新建项目
          </motion.button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3">
        {loadingProjects ? (
          <div className="flex flex-col items-center justify-center p-6 text-[#4a3520]/70">
            <motion.div 
              className="w-8 h-8 border-3 border-[#d3b78f] border-t-[#c93e00] rounded-full mb-3"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-sm">加载项目中...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-[#4a3520]/70">
            <FileImage size={32} className="mb-3 opacity-50" />
            <p className="text-sm text-center">暂无项目，点击"新建项目"开始</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.keys(groupedProjects).map(date => (
              <div key={date} className="border border-[#d3b78f]/50 rounded-lg overflow-hidden">
                <button 
                  className="w-full flex items-center justify-between p-2.5 bg-[#d3b78f]/30 text-sm font-medium"
                  onClick={() => toggleGroup(date)}
                >
                  <span>{date}</span>
                  <span className="text-[#8c6d46]">
                    {collapsed[date] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </span>
                </button>
                
                <AnimatePresence>
                  {!collapsed[date] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-2 space-y-2">
                        {groupedProjects[date].map(project => (
                          <ProjectItem 
                            key={project.id}
                            project={project}
                            isActive={currentProject && currentProject.id === project.id}
                            onClick={() => selectProject(project.id)}
                            onDelete={(e) => handleDeleteClick(e, project)}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 项目项组件
function ProjectItem({ project, isActive, onClick, onDelete }) {
  return (
    <motion.div 
      className={`
        flex items-center p-2 rounded-md cursor-pointer relative
        ${isActive ? 'bg-[#c8a675]/70 border-[#c93e00]' : 'bg-[#f8f2e0] hover:bg-[#f8f2e0]/70'}
        border ${isActive ? 'border-[#c93e00]' : 'border-[#d3b78f]/50'}
        transition-colors
      `}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="w-10 h-10 rounded-md overflow-hidden border border-[#d3b78f] flex-shrink-0">
        <img 
          src={API_BASE_URL + project.imageUrl} 
          alt={project.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="ml-2 flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{project.name}</p>
        <p className="text-xs text-[#4a3520]/70">{project.createdAt.split(' ')[1]}</p>
      </div>
      <motion.button
        className="w-6 h-6 flex items-center justify-center text-[#4a3520]/50 hover:text-[#c93e00] transition-colors"
        onClick={onDelete}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Trash2 size={14} />
      </motion.button>
    </motion.div>
  );
}

// 右侧边栏组件（仅在第4步显示）
function RightSidebar({ currentProject, selectedCharacterId, updateCurrentProject, setError }) {
  const [prompt, setPrompt] = useState("侍女反复鞠躬，最后恢复原始站姿，保留古画画风与平面质感");
  const [duration, setDuration] = useState(5);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  
  // 提示词预设
  const presets = [
    { id: 1, name: "鞠躬", prompt: "侍女反复鞠躬，最后恢复原始站姿，保留古画画风与平面质感" },
    { id: 2, name: "舞蹈", prompt: "人物跳舞，手臂和衣袖流畅摆动，保持古画风格和平面质感" },
    { id: 3, name: "挥手", prompt: "人物微笑着缓慢挥手，衣袖随动作飘动，保持古画风格" },
  ];
  
  // 获取当前选中角色的视频列表
  const characterVideos = currentProject.videos?.filter(
    video => video.character_id === selectedCharacterId
  ) || [];

  const generateVideo = async () => {
    setGeneratingVideo(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_id: currentProject.id,
          character_id: selectedCharacterId,
          prompt,
          duration
        }),
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // 获取更新后的文件列表
        await fetchFiles(currentProject.id);
      } else {
        setError('视频生成失败: ' + (data.message || '未知错误'));
      }
    } catch (err) {
      setError('视频生成请求失败: ' + err.message);
    } finally {
      setGeneratingVideo(false);
    }
  };

  const fetchFiles = async (imageId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/files/${imageId}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        updateCurrentProject({ videos: data.files.videos || [] });
      }
    } catch (err) {
      setError('获取文件列表失败: ' + err.message);
    }
  };
  
  // 选择预设提示词
  const selectPreset = (preset) => {
    setPrompt(preset.prompt);
    setSelectedPreset(preset.id);
  };
  
  // 切换展开/折叠
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="w-full lg:w-80 flex-shrink-0">
      <motion.div 
        className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md overflow-hidden border border-[#d3b78f]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="p-3 bg-[#c8a675]/50 flex justify-between items-center cursor-pointer"
             onClick={toggleExpanded}>
          <h3 className="font-semibold text-[#4a3520]">生成视频</h3>
          <button className="text-[#8c6d46]">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1.5 text-[#4a3520]">提示词预设:</label>
                  <div className="flex flex-wrap gap-2">
                    {presets.map(preset => (
                      <motion.button
                        key={preset.id}
                        className={`
                          px-3 py-1.5 text-xs rounded-full border 
                          ${selectedPreset === preset.id 
                            ? 'border-[#c93e00] bg-[#c93e00]/10 text-[#c93e00]' 
                            : 'border-[#d3b78f] bg-[#f8f2e0] text-[#8c6d46] hover:bg-[#d3b78f]/30'}
                          transition-colors
                        `}
                        onClick={() => selectPreset(preset)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {preset.name}
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1.5 text-[#4a3520]">提示词:</label>
                  <textarea 
                    className="w-full px-3 py-2 rounded-lg border border-[#d3b78f] bg-[#f8f2e0]/70 focus:outline-none focus:ring-2 focus:ring-[#c93e00]/30 focus:border-[#c93e00] transition-all resize-none"
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      setSelectedPreset(null);
                    }}
                    rows={4}
                    placeholder="描述角色应该如何动作..."
                    disabled={generatingVideo}
                  />
                </div>
                
                <div className="mb-5">
                  <label className="block text-sm font-medium mb-1.5 text-[#4a3520]">视频时长 (秒): {duration}</label>
                  <input 
                    type="range"
                    min={1}
                    max={10}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 5)}
                    disabled={generatingVideo}
                    className="w-full h-2 bg-[#d3b78f] rounded-full appearance-none cursor-pointer accent-[#c93e00]"
                  />
                  <div className="flex justify-between text-xs text-[#8c6d46] mt-1">
                    <span>1秒</span>
                    <span>5秒</span>
                    <span>10秒</span>
                  </div>
                </div>
                
                <motion.button 
                  className={`
                    w-full py-3 rounded-lg flex items-center justify-center font-medium text-white
                    ${generatingVideo ? 'bg-[#8c6d46]' : 'bg-[#c93e00] hover:bg-[#b33e00]'}
                    transition-colors
                  `}
                  onClick={generateVideo}
                  disabled={generatingVideo}
                  whileHover={!generatingVideo ? { scale: 1.02 } : {}}
                  whileTap={!generatingVideo ? { scale: 0.98 } : {}}
                >
                  {generatingVideo ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      生成中...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2" size={18} />
                      生成视频
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {characterVideos.length > 0 && (
        <motion.div 
          className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md overflow-hidden border border-[#d3b78f] mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="p-3 bg-[#c8a675]/50">
            <h3 className="font-semibold text-[#4a3520]">生成的视频</h3>
          </div>
          
          <div className="p-4 grid gap-4">
            {characterVideos.map((video, index) => (
              <VideoItem key={index} video={video} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// 视频项组件
function VideoItem({ video }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div 
      className="border border-[#d3b78f] rounded-lg overflow-hidden bg-[#f8f2e0]/70"
      whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <video 
          className="w-full h-auto"
          src={API_BASE_URL + video.url}
          controls
          preload="metadata"
        />
        
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              className="absolute bottom-2 right-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <a 
                href={API_BASE_URL + video.url}
                download
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/90 text-[#c93e00] shadow-lg hover:bg-white transition-colors"
              >
                <Download size={16} />
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// 步骤1: 上传图像
function Step1Upload({ createNewProject, setError, setCurrentStep, currentProject }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // 模拟进度条
  useEffect(() => {
    let interval;
    if (uploading && uploadProgress < 90) {
      interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + Math.random() * 15, 90));
      }, 300);
    }
    
    return () => clearInterval(interval);
  }, [uploading, uploadProgress]);
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };
  
  const handleFileUpload = async (file) => {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      setError('请上传图像文件');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      
      setUploadProgress(100);
      
      const data = await response.json();
      
      if (data.status === 'success') {
        createNewProject(data.image_id, data.filename, data.url);
        
        // 延迟切换到下一步，让用户感知上传完成
        setTimeout(() => {
          setCurrentStep(2);
        }, 800);
      } else {
        setError('上传失败: ' + (data.message || '未知错误'));
      }
    } catch (err) {
      setError('上传请求失败: ' + err.message);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 800);
    }
  };
  
  const openFileDialog = () => {
    fileInputRef.current.click();
  };
  
  // 如果当前已经有项目，则显示提示信息
  if (currentProject) {
    setCurrentStep(2);
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <motion.div 
        className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md overflow-hidden border border-[#d3b78f]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[#8c6d46] mb-2">第一步: 上传古画图像</h2>
          <p className="text-[#4a3520]/80 mb-6">
            请上传一张中国古画图像，系统将自动检测画中人物并提取为可动画化的资产。
          </p>
          
          <div 
            className={`
              relative border-2 dashed rounded-xl p-8 sm:p-12 
              flex flex-col items-center justify-center cursor-pointer
              transition-all duration-200
              ${dragActive 
                ? 'border-[#c93e00] bg-[#c93e00]/5' 
                : 'border-[#d3b78f] bg-[#f8f2e0]/30 hover:bg-[#f8f2e0]/60'}
              ${uploading ? 'pointer-events-none' : ''}
            `}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden"
              accept="image/*" 
              onChange={handleFileChange}
              disabled={uploading}
            />
            
            {uploading ? (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 mb-4 relative">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle 
                      className="text-[#d3b78f]/30"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle 
                      className="text-[#c93e00]"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - uploadProgress / 100)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold">{Math.round(uploadProgress)}%</span>
                  </div>
                </div>
                <p className="text-[#4a3520] font-medium">上传中...</p>
                <p className="text-[#8c6d46] text-sm mt-1">请勿关闭窗口</p>
              </div>
            ) : (
              <>
                <motion.div
                  className="w-16 h-16 bg-[#f8f2e0] rounded-full flex items-center justify-center text-[#c93e00] mb-4"
                  animate={{ scale: dragActive ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Upload size={28} />
                </motion.div>
                <p className="text-[#4a3520] font-medium mb-2">拖放图像到此处</p>
                <p className="text-[#8c6d46] text-sm">或点击选择文件</p>
              </>
            )}
          </div>
          
          <div className="mt-6 bg-[#f8f2e0]/60 rounded-lg p-4 border border-[#d3b78f]">
            <h3 className="font-medium text-[#8c6d46] flex items-center">
              <HelpCircle size={16} className="mr-2" />
              小贴士
            </h3>
            <ul className="mt-2 text-sm text-[#4a3520]/80 space-y-1">
              <li>• 推荐上传清晰的传统中国画作品，如工笔画或写意画</li>
              <li>• 画中人物形象越完整，动画效果越好</li>
              <li>• 支持常见图像格式: JPG, PNG, WEBP</li>
            </ul>
          </div>
        </div>
      </motion.div>
      
      {/* <div className="mt-8 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-6 max-w-lg w-full"
        >
          {[1, 2, 3].map(i => (
            <div key={i} className="aspect-square bg-[#d3b78f]/20 rounded-lg overflow-hidden border border-[#d3b78f]/40">
              <img 
                src={`/examples/example${i}.jpg`} 
                alt={`示例${i}`}
                className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity"
              />
            </div>
          ))}
        </motion.div>
      </div> */}
    </div>
  );
}

// 步骤2: 检测人物
function Step2Detect({ currentProject, updateCurrentProject, setError, setCurrentStep }) {
  const [confThreshold, setConfThreshold] = useState(0.6);
  const [detections, setDetections] = useState(null);
  const [detectedImageUrl, setDetectedImageUrl] = useState(null);
  const [detectingCharacters, setDetectingCharacters] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showComparison, setShowComparison] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderRef = useRef(null);
  
  // 模拟进度条
  useEffect(() => {
    let interval;
    if (detectingCharacters && detectionProgress < 95) {
      interval = setInterval(() => {
        setDetectionProgress(prev => Math.min(prev + Math.random() * 10, 95));
      }, 200);
    } else if (processingImage && processingProgress < 95) {
      interval = setInterval(() => {
        setProcessingProgress(prev => Math.min(prev + Math.random() * 8, 95));
      }, 300);
    }
    
    return () => clearInterval(interval);
  }, [detectingCharacters, processingImage, detectionProgress, processingProgress]);
  
  const detectCharacters = async () => {
    setDetectingCharacters(true);
    setDetectionProgress(0);
    try {
      const response = await fetch(`${API_BASE_URL}/api/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_id: currentProject.id,
          conf_threshold: confThreshold,
        }),
      });
      
      setDetectionProgress(100);
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setTimeout(() => {
          setDetections(data.detections);
          setDetectedImageUrl(data.image_with_boxes);
          updateCurrentProject({ 
            detections: data.detections,
            detectedImageUrl: data.image_with_boxes
          });
          setShowComparison(true);
        }, 500);
      } else {
        setError('人物检测失败: ' + (data.message || '未知错误'));
      }
    } catch (err) {
      setError('人物检测请求失败: ' + err.message);
    } finally {
      setTimeout(() => {
        setDetectingCharacters(false);
      }, 500);
    }
  };
  
  const processImage = async () => {
    setProcessingImage(true);
    setProcessingProgress(0);
    try {
      const response = await fetch(`${API_BASE_URL}/api/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_id: currentProject.id,
          detection_id: 0, // 处理所有检测到的人物
        }),
      });
      
      setProcessingProgress(100);
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setTimeout(() => {
          updateCurrentProject({ 
            assets: {
              background: data.background_image,
              characters: data.characters
            }
          });
          setCurrentStep(3);
        }, 800);
      } else {
        setError('图像处理失败: ' + (data.message || '未知错误'));
      }
    } catch (err) {
      setError('图像处理请求失败: ' + err.message);
    } finally {
      setTimeout(() => {
        setProcessingImage(false);
      }, 800);
    }
  };
  
  // 处理比较滑块
  const handleSliderMove = (e) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newPosition = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(newPosition);
  };
  
  const handleSliderMouseDown = () => {
    document.addEventListener('mousemove', handleSliderMove);
    document.addEventListener('mouseup', handleSliderMouseUp);
  };
  
  const handleSliderMouseUp = () => {
    document.removeEventListener('mousemove', handleSliderMove);
    document.removeEventListener('mouseup', handleSliderMouseUp);
  };
  
  // 如果已经有检测结果，直接显示
  useEffect(() => {
    if (currentProject.detections) {
      setDetections(currentProject.detections);
      setDetectedImageUrl(currentProject.detectedImageUrl);
      setShowComparison(true);  // 添加这一行来显示检测结果
    }
  }, [currentProject]);
  
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div 
        className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md overflow-hidden border border-[#d3b78f]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[#8c6d46] mb-2">第二步: 检测古画中的人物</h2>
          <p className="text-[#4a3520]/80 mb-6">
            调整置信度阈值，系统将自动识别画中的人物。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
            <div className="w-full sm:w-2/3 bg-[#f8f2e0]/50 p-4 rounded-lg border border-[#d3b78f]">
              <div className="flex items-center mb-2">
                <span className="text-sm font-medium mr-2">置信度阈值:</span>
                <span className="bg-[#c93e00]/10 text-[#c93e00] px-2 py-0.5 rounded text-sm font-medium">
                  {confThreshold.toFixed(2)}
                </span>
              </div>
              <div className="relative h-2 bg-[#d3b78f]/30 rounded-full">
                <div 
                  className="absolute h-full bg-gradient-to-r from-[#d3b78f] to-[#c93e00] rounded-full"
                  style={{ width: `${confThreshold * 100}%` }}
                ></div>
                <input 
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={confThreshold}
                  onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={detectingCharacters}
                />
              </div>
              <div className="flex justify-between text-xs text-[#8c6d46] mt-1">
                <span>低 (0.1)</span>
                <span>中 (0.5)</span>
                <span>高 (0.9)</span>
              </div>
            </div>
            
            <motion.button 
              className={`
                w-full sm:w-1/3 py-3 rounded-lg flex items-center justify-center font-medium
                ${detectingCharacters 
                  ? 'bg-[#8c6d46] text-white' 
                  : 'bg-[#c93e00] text-white hover:bg-[#b33e00]'}
                transition-colors
              `}
              onClick={detectCharacters}
              disabled={detectingCharacters}
              whileHover={!detectingCharacters ? { scale: 1.02 } : {}}
              whileTap={!detectingCharacters ? { scale: 0.98 } : {}}
            >
              {detectingCharacters ? (
                <>
                  <div className="h-5 w-5 mr-2 relative">
                    <svg className="absolute inset-0 animate-spin" viewBox="0 0 100 100">
                      <circle 
                        className="text-white/30"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                      <circle 
                        className="text-white"
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - detectionProgress / 100)}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                    </svg>
                  </div>
                  检测中...
                </>
              ) : (
                <>
                  <Scan className="mr-2" size={18} />
                  检测人物
                </>
              )}
            </motion.button>
          </div>
          
          {showComparison && detections && (
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div 
                ref={sliderRef}
                className="relative rounded-lg overflow-hidden border border-[#d3b78f] h-[300px] sm:h-[400px] lg:h-[500px] cursor-col-resize"
                onMouseDown={handleSliderMouseDown}
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${API_BASE_URL + detectedImageUrl})` }}
                ></div>
                
              </div>
              
              <div className="mt-4 bg-[#f8f2e0]/70 p-4 rounded-lg border border-[#d3b78f] flex flex-col sm:flex-row items-center justify-between">
                <div className="mb-4 sm:mb-0">
                  <p className="text-[#4a3520] font-medium">
                    检测到 <span className="text-[#c93e00] font-bold">{detections.length}</span> 个人物
                  </p>
                  <p className="text-sm text-[#8c6d46] mt-1">点击"获取图像资产"继续</p>
                </div>
                <motion.button 
                  className={`
                    px-6 py-3 rounded-lg flex items-center justify-center font-medium
                    ${processingImage 
                      ? 'bg-[#8c6d46] text-white' 
                      : 'bg-[#c93e00] text-white hover:bg-[#b33e00]'}
                    transition-colors
                  `}
                  onClick={processImage}
                  disabled={processingImage}
                  whileHover={!processingImage ? { scale: 1.02 } : {}}
                  whileTap={!processingImage ? { scale: 0.98 } : {}}
                >
                  {processingImage ? (
                    <>
                      <div className="h-5 w-5 mr-2 relative">
                        <svg className="absolute inset-0 animate-spin" viewBox="0 0 100 100">
                          <circle 
                            className="text-white/30"
                            strokeWidth="8"
                            stroke="currentColor"
                            fill="transparent"
                            r="40"
                            cx="50"
                            cy="50"
                          />
                          <circle 
                            className="text-white"
                            strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - processingProgress / 100)}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="40"
                            cx="50"
                            cy="50"
                          />
                        </svg>
                      </div>
                      处理中...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2" size={18} />
                      获取图像资产
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
          
          {!detections && (
            <div className="rounded-lg overflow-hidden border border-[#d3b78f]">
              <img 
                src={API_BASE_URL + currentProject.imageUrl} 
                alt="原始图像"
                className="w-full h-auto max-h-[500px] object-contain"
              />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// 步骤3: 获取图像资产
function Step3Assets({ currentProject, updateCurrentProject, setError, setCurrentStep, setSelectedCharacterId }) {
  const [activeTab, setActiveTab] = useState('all');
  const [hoveredCharacterId, setHoveredCharacterId] = useState(null);
  const [previewAsset, setPreviewAsset] = useState(null);
  
  const handleCharacterClick = (characterId) => {
    setSelectedCharacterId(characterId);
    setCurrentStep(4);
  };
  
  // 下载单个资产函数
  const downloadAsset = (url, filename) => {
    // 创建一个临时的<a>元素来触发下载
    const link = document.createElement('a');
    link.href = API_BASE_URL + url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // 下载所有资产函数
  const downloadAllAssets = () => {
    // 下载背景
    downloadAsset(currentProject.assets.background, `背景_${currentProject.name}`);
    
    // 下载所有人物
    currentProject.assets.characters.forEach((character, index) => {
      setTimeout(() => {
        downloadAsset(character.character_image, `人物${character.id}_${currentProject.name}`);
      }, index * 500); // 添加延迟，避免浏览器阻止多个下载
    });
  };
  
  // 预览资产
  const handlePreview = (type, asset) => {
    if (type === 'background') {
      setPreviewAsset({
        type: 'background',
        url: API_BASE_URL + currentProject.assets.background,
        title: '背景图像'
      });
    } else {
      setPreviewAsset({
        type: 'character',
        url: API_BASE_URL + asset.character_image,
        title: `人物 ${asset.id}`,
        id: asset.id
      });
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      <motion.div 
        className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md overflow-hidden border border-[#d3b78f]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#8c6d46] mb-1">第三步: 图像资产</h2>
              <p className="text-[#4a3520]/80">
                系统已分离出画中人物和背景。选择一个人物来生成动画，或下载资产。
              </p>
            </div>
            
            <motion.button 
              className="mt-3 sm:mt-0 flex items-center justify-center px-4 py-2 bg-[#8c6d46] text-white rounded-lg hover:bg-[#c93e00] transition-colors"
              onClick={downloadAllAssets}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Download size={16} className="mr-2" />
              下载所有资产
            </motion.button>
          </div>
          
          {/* 标签页导航 */}
          <div className="flex border-b border-[#d3b78f] mb-4">
            <button 
              className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                activeTab === 'all' 
                  ? 'text-[#c93e00]' 
                  : 'text-[#8c6d46] hover:text-[#c93e00]/70'
              }`}
              onClick={() => setActiveTab('all')}
            >
              全部资产
              {activeTab === 'all' && (
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c93e00]"
                  layoutId="activeTabIndicator"
                />
              )}
            </button>
            <button 
              className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                activeTab === 'background' 
                  ? 'text-[#c93e00]' 
                  : 'text-[#8c6d46] hover:text-[#c93e00]/70'
              }`}
              onClick={() => setActiveTab('background')}
            >
              背景
              {activeTab === 'background' && (
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c93e00]"
                  layoutId="activeTabIndicator"
                />
              )}
            </button>
            <button 
              className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                activeTab === 'characters' 
                  ? 'text-[#c93e00]' 
                  : 'text-[#8c6d46] hover:text-[#c93e00]/70'
              }`}
              onClick={() => setActiveTab('characters')}
            >
              人物
              {activeTab === 'characters' && (
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c93e00]"
                  layoutId="activeTabIndicator"
                />
              )}
            </button>
          </div>
          
          {currentProject.assets && (
            <div className="space-y-6">
              {/* 背景部分 */}
              {(activeTab === 'all' || activeTab === 'background') && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg border border-[#d3b78f] bg-[#f8f2e0]/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[#8c6d46]">背景</h3>
                    <div className="flex gap-2">
                      <motion.button 
                        className="px-3 py-1 text-xs rounded-full border border-[#d3b78f] text-[#8c6d46] hover:bg-[#d3b78f]/30 transition-colors"
                        onClick={() => handlePreview('background')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        预览
                      </motion.button>
                      <motion.button 
                        className="px-3 py-1 text-xs rounded-full border border-[#d3b78f] bg-[#d3b78f]/20 text-[#8c6d46] hover:bg-[#d3b78f]/40 transition-colors flex items-center"
                        onClick={() => downloadAsset(currentProject.assets.background, `背景_${currentProject.name}`)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Download size={12} className="mr-1" />
                        下载
                      </motion.button>
                    </div>
                  </div>
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-[#d3b78f]">
                    <img 
                      src={API_BASE_URL + currentProject.assets.background} 
                      alt="背景"
                      className="w-full h-full object-contain bg-[#f8f2e0]/80"
                    />
                  </div>
                </motion.div>
              )}
              
              {/* 人物部分 */}
              {(activeTab === 'all' || activeTab === 'characters') && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[#8c6d46]">人物</h3>
                    <p className="text-sm text-[#4a3520]/70">点击人物进入动画制作</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {currentProject.assets.characters.map(character => (
                      <CharacterCard 
                        key={character.id}
                        character={character}
                        onHover={setHoveredCharacterId}
                        onClick={() => handleCharacterClick(character.id)}
                        onDownload={() => downloadAsset(character.character_image, `人物${character.id}_${currentProject.name}`)}
                        onPreview={() => handlePreview('character', character)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>
      
      {/* 预览模态框 */}
      <AnimatePresence>
        {previewAsset && (
          <AssetPreviewModal 
            asset={previewAsset} 
            onClose={() => setPreviewAsset(null)}
            onSelect={previewAsset.type === 'character' ? () => handleCharacterClick(previewAsset.id) : null}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// 人物卡片组件
function CharacterCard({ character, onHover, onClick, onDownload, onPreview }) {
  return (
    <motion.div 
      className="rounded-lg overflow-hidden border border-[#d3b78f] bg-[#f8f2e0]/50 flex flex-col"
      whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
    >
      <div 
        className="relative aspect-square cursor-pointer bg-white/30 p-2"
        onClick={onClick}
        onMouseEnter={() => onHover(character.id)}
        onMouseLeave={() => onHover(null)}
      >
        <motion.div 
          className="w-full h-full flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <img 
            src={API_BASE_URL + character.character_image} 
            alt={`人物 ${character.id}`}
            className="max-w-full max-h-full object-contain"
          />
        </motion.div>
        
        <motion.div 
          className="absolute inset-0 bg-[#4a3520]/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
          transition={{ duration: 0.2 }}
        >
          <span className="bg-white/90 text-[#c93e00] px-3 py-1.5 rounded-full text-sm font-medium">
            制作动画
          </span>
        </motion.div>
      </div>
      
      <div className="p-2 border-t border-[#d3b78f]/50 flex justify-between items-center">
        <span className="text-sm font-medium text-[#8c6d46]">人物 {character.id}</span>
        <div className="flex gap-1">
          <motion.button 
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#8c6d46] hover:bg-[#d3b78f]/30 transition-colors"
            onClick={onPreview}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="4"></circle>
              <line x1="21.17" y1="8" x2="12" y2="8"></line>
              <line x1="3.95" y1="6.06" x2="8.54" y2="14"></line>
              <line x1="10.88" y1="21.94" x2="15.46" y2="14"></line>
            </svg>
          </motion.button>
          <motion.button 
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#8c6d46] hover:bg-[#d3b78f]/30 transition-colors"
            onClick={onDownload}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Download size={14} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// 资产预览模态框
function AssetPreviewModal({ asset, onClose, onSelect }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#4a3520]/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-3 bg-[#f8f2e0] border-b border-[#d3b78f] flex justify-between items-center">
          <h3 className="font-semibold text-[#8c6d46]">{asset.title}</h3>
          <button 
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#4a3520]/70 hover:bg-[#d3b78f]/30 hover:text-[#c93e00] transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
          <img 
            src={asset.url} 
            alt={asset.title}
            className="max-w-full max-h-[60vh] object-contain"
          />
        </div>
        
        <div className="p-4 border-t border-[#d3b78f] flex justify-end gap-3 bg-[#f8f2e0]">
          <motion.button 
            className="px-4 py-2 rounded-lg border border-[#d3b78f] text-[#8c6d46] hover:bg-[#d3b78f]/30 transition-colors"
            onClick={onClose}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            关闭
          </motion.button>
          
          {onSelect && (
            <motion.button 
              className="px-4 py-2 rounded-lg bg-[#c93e00] text-white hover:bg-[#b33e00] transition-colors"
              onClick={onSelect}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              使用此人物制作动画
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// 步骤4: 获取动画资产
function Step4Animate({ currentProject, selectedCharacterId, updateCurrentProject, setError, setCurrentStep }) {
  // 找到选中的角色
  const selectedCharacter = currentProject.assets?.characters.find(
    char => char.id === selectedCharacterId
  );
  
  // 动画参考示例
  const animationExamples = [
    { id: 1, title: "摇摆动作", thumbnailUrl: "/examples/animation1.gif" },
    { id: 2, title: "鞠躬动作", thumbnailUrl: "/examples/animation2.gif" },
    { id: 3, title: "招手动作", thumbnailUrl: "/examples/animation3.gif" },
  ];
  
  return (
    <div className="flex-1">
      <motion.div 
        className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md overflow-hidden border border-[#d3b78f]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[#8c6d46] mb-2">第四步: 生成人物动画</h2>
          <p className="text-[#4a3520]/80 mb-6">
            为选中的人物生成动画，可以在右侧调整参数。
          </p>
          
          {selectedCharacter && (
            <motion.div 
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div 
                className="w-full max-w-xs h-60 sm:h-80 flex items-center justify-center bg-[#f8f2e0] rounded-lg border border-[#d3b78f] mb-4 relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
              >
                <img 
                  src={API_BASE_URL + selectedCharacter.character_image} 
                  alt={`人物 ${selectedCharacterId}`}
                  className="max-h-full max-w-full object-contain"
                />
                
                {/* 装饰性的纸张折痕 */}
                <div className="absolute inset-0 pointer-events-none opacity-40">
                  <div className="absolute left-0 top-1/3 w-full h-px bg-[#8c6d46]/20"></div>
                  <div className="absolute top-0 left-1/4 w-px h-full bg-[#8c6d46]/20"></div>
                </div>
              </motion.div>
              
              <p className="mb-8 text-center">
                <span className="inline-block bg-[#c93e00]/10 text-[#c93e00] px-3 py-1 rounded-lg font-medium">
                  已选择人物 ID: {selectedCharacterId}
                </span>
              </p>
              
              <div className="w-full border-t border-[#d3b78f] pt-6">
                {/* <h3 className="font-semibold text-[#8c6d46] mb-4">动画参考示例</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {animationExamples.map(example => (
                    <motion.div 
                      key={example.id}
                      className="border border-[#d3b78f] rounded-lg overflow-hidden bg-[#f8f2e0]/50"
                      whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                    >
                      <div className="aspect-square bg-white/50 flex items-center justify-center p-2">
                        <img 
                          src={example.thumbnailUrl} 
                          alt={example.title}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="p-2 border-t border-[#d3b78f]/50">
                        <p className="text-sm font-medium text-center text-[#8c6d46]">{example.title}</p>
                      </div>
                    </motion.div>
                  ))}
                </div> */}
                <p className="mt-4 text-sm text-[#4a3520]/70 text-center">
                  在右侧填写提示词，描述您希望人物如何动作
                </p>
              </div>
            </motion.div>
          )}
          
          {!selectedCharacter && (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#f8f2e0] flex items-center justify-center text-[#c93e00] mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#8c6d46] mb-2">未选择人物</h3>
              <p className="text-[#4a3520]/70 mb-6">
                请返回第三步，选择一个人物进行动画制作
              </p>
              <motion.button 
                className="px-4 py-2 rounded-lg bg-[#c93e00] text-white hover:bg-[#b33e00] transition-colors"
                onClick={() => setCurrentStep(3)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                返回选择人物
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
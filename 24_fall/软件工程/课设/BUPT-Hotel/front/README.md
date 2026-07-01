# BUPT-Hotel 前端

酒店管理课程项目的 React 前端，使用 Vite 构建，包含客房管理、入住流程和数据可视化等界面。

## 本地运行

需要 Node.js 18 或更高版本：

```bash
npm install
npm run dev
```

生产构建与本地预览：

```bash
npm run build
npm run preview
```

天气服务与大模型功能需要分别配置 `VITE_QWEATHER_API_KEY` 和 `VITE_GLM_API_KEY`。请只在本地环境文件中填写真实密钥，不要提交凭证。后端启动方式及项目整体结构见[上级说明](../README.md)。

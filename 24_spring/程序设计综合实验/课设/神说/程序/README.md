# GodSay|神说

## 一款基于Agent技术的形式语言与自动机辅助学习游戏

### 在线体验

​	项目目前已由GitHub Page托管发布，欢迎您来体验！

​	游戏：

​		https://wangdianyun.github.io/GodSay/

​	展示：

​		https://gamma.app/docs/GodSay-tv028highfk56sk

### 项目简介

​	本项目服务于北京邮电大学《形式语言与自动机》课程教学，以RPG（角色扮演）游戏的形式带领玩家一步步深入探索神奇的魔法世界，在完成任务与战斗的过程中逐渐学习形式语言与自动机的核心概念与算法。不同于传统游戏基于规则的NPC设计方法与固定的剧情线路，我们的项目通过人物设计与ChatGPT接入，为游戏引入了由ChatGPT自主控制的Agent（智能体），为玩家提供了形式语言与自动机的全自动答疑，与更加丰富的交互体验，让玩家在新奇且沉浸的体验中，感受形式语言与自动机知识的美妙。

​	本项目主要使用web开发技术，让玩家可以通过浏览器访问我们的游戏，提供全平台浏览器支持（Windows，MacOS，Android与IOS），跨越了平台壁垒，为更多玩家提供服务。

本系统设计的主要创新点有：

​    1. 寓教于乐的教学模式

​	不同于传统教学辅助工具的枯燥乏味，本系统引入ARPG游戏模式，帮助学生在游戏中学习新知识，在增强学生学习自主性的同时降低了知识学习过程中的枯燥乏味。

2.LLM赋能Agent自主答疑

​	 大语言模型自主决策，让游戏中的非玩家角色拥有自主探索环境、不设限回复的能力。突破了传统游戏中NPC交互死板的局限，实现了游戏角色的智能交互，增加了游戏的沉浸感。并且采用模块化设计,可以灵活地定制和扩展角色的能力，便于维护和管理。

​    3. 内嵌式形式语言与自动机解密插件

​	知识只有在应用中才能掌握扎实，通过开发形式语言与自动机解密插件，我们为玩家提供了在游戏中交互式解题的方式，并在游戏中加入了大量解谜元素。谜题即形式语言与自动机的题目。玩家可以通过构造自己的DFA、NFA、CFG、REG和PDA来获得武器、解除禁制、学习魔法。

​	在游戏中，我们为玩家设计了一个自动机可视化构造模块，它主要负责给用户提供一个直观友好的自动机状态和转换关系编辑页面，帮助用户直观理解自动机的运行和状态转移，并在解决谜题的同时学习知识。它的主要功能包括：绘制状态图、编辑状态和转换、设置初始和终止状态、输入文法、测试自动机接受的字符串。

### 项目验收帮助

​	本项目由三个松耦合的基本部分构成，三个部分分别为游戏用户管理（位于GodSayAccountManager目录）、GodSay游戏本体（位于GodSay目录）和形式语言与自动机构造页（位于FLAPplugin目录），下面是本项目的验收帮助。

#### 软件环境基本要求

##### 1. IDE建议

对于验收，建议使用和开发环境一样的IDE版本，有助于减少错误的可能。

开发环境中使用到的IDE版本如下：

- IntelliJ IDEA 2024.1 (Ultimate Edition)

  建议负责FLAPplugin、GodSay部分验收；

- PyCharm 2024.1.1 (Professional Edition)

  建议负责GodSayAccountManager部分验收；

##### 2. JavaScript环境

- 安装Node.js

  - 版本要求：v18.20.0

  - 安装和配置：

    1. 下载Node.js v18.20.0安装包。

    2. 根据操作系统（Windows、macOS、Linux）运行安装程序。

    3. 安装完成后，验证安装：

       ```bash
       node -v
       ```

       确保输出版本为v18.20.0。

- 安装serve服务

  - 安装 serve 模块： 使用 npm（Node.js 的包管理工具）来全局安装 serve 模块。

    ```bash
    npm install -g serve
    ```

  - 验证安装： 通过以下命令检查 serve 是否已成功安装。

    ```bash
    serve -v
    ```

    如果安装成功，将会显示 serve 的版本号。

##### 3. Python环境

- Conda

  - 版本要求：23.7.4

  - 安装和配置：

    1. 下载Anaconda或Miniconda的最新安装包。

    2. 运行安装程序并按照指示完成安装。

    3. 安装完成后，更新conda到指定版本：

       ```bash
       conda install conda=23.7.4
       ```

    4. 验证安装：

       ```bash
       conda -V
       ```

       确保输出版本为23.7.4。

##### 4. 数据库环境

- MySQL数据库

  - 安装和配置：

    1. 下载适用于操作系统的MySQL安装包。

    2. 运行安装程序并按照指示完成安装。

    3. 配置MySQL数据库：

       - 设置root用户的密码。
       - 启动MySQL服务。
       - 创建必要的数据库和用户。

    4. 验证安装和配置：

       ```bash
       mysql -u root -p
       ```

       输入密码后，确保能够成功登录到MySQL数据库。

##### 网络环境要求

​	由于项目在运行时需要与外部API进行通信，因此需要验收环境能够正常与https://api.openai.com/v1/chat/completions完成通信。

#### 项目环境配置

1. ##### 形式语言与自动机构造页（已经打包完成 验收可以直接执行开启服务器步）

   - 进入FLAPplugin目录

     ```bash
     cd FLAPplugin
     ```

   - 安装必要的包：

     ```bash
     npm install --registry=https://registry.npmmirror.com
     ```

   - 配置环境变量

     ```bash
     $env:NODE_OPTIONS="--openssl-legacy-provider" 
     ```

   - 构建项目

     ```bash
     npm build
     ```

   - 开启服务器

     ```bash
     $env:NODE_OPTIONS="--openssl-legacy-provider" 
     serve build 
     ```

     查看终端输出的消息，浏览器打开指定URL便可以查看并测试形式语言与自动机构造页的功能

   - 测试功能

     以页面服务器建立在http://localhost:3000上为例。

     只需在本机浏览器上打开以下网址即可：

     nfa页面：http://localhost:3000/?mode=nfa&exam_data=a

     dfa页面：http://localhost:3000/?mode=dfa&exam_data=a

     cfg页面：http://localhost:3000/?mode=cfg&exam_data=a

     reg页面：http://localhost:3000/?mode=reg&exam_data=a

     pda页面：http://localhost:3000/?mode=pda&exam_data=a

     **注意：不要使用“镌刻”功能，该功能仅在游戏中有效。**

2. ##### GodSay游戏本体

   - 进入GodSay目录

     ```bash
     cd GodSay
     ```

   - 开启服务器

     ```bash
     serve
     ```

     查看终端输出的消息，浏览器打开指定URL便可以查看并测试游戏本体的功能

   - 测试功能

     以页面服务器建立在http://localhost:3000上为例，在浏览器地址栏中输入http://localhost:3000即可测试游戏。

3. ##### 游戏用户管理

   - 进入GodSayAccountManager目录

     ```bash
     cd GodSayAccountManager
     ```

   - 初始化数据库并修改数据库配置

     1. 使用 MySQL 命令行客户端运行：

     ```bash
     mysql -u root -p
     ```

     2. 在MySQL数据库中运行：

     ```sql
     CREATE DATABASE user_management;
     
     USE user_management;
     
     CREATE TABLE users (
         id INT AUTO_INCREMENT PRIMARY KEY,
         username VARCHAR(255) NOT NULL UNIQUE,
         password_hash VARCHAR(255) NOT NULL,
         email VARCHAR(255) NOT NULL UNIQUE,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );
     ```

     3. 在GodSayAccountService.py文件中，修改：

     ```python
     # 数据库配置
     db_config = {
         'host': 'localhost',
         'user': 'root', #改成你的用户名
         'password': '040803', #改成与用户名对应的密码
         'database': 'user_management'
     }
     ```

   - 创建conda环境并安装必要的包：

     ```bash
     conda env create -f environment.yml
     ```

   - 激活conda环境

     ```bash
     conda activate GodSayAccount
     ```

   - 在5000端口上启动后端服务器

     ```bash
     python GodSayAccountService.py
     ```

   - 启动前端服务器

     开启一个新的终端，输入

     ```bash
     serve
     ```

​		查看终端输出的消息，浏览器打开指定URL便可以查看并测试游戏用户管理的功能。



# 老师辛苦啦

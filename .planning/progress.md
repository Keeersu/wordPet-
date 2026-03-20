# WordPet - 进度日志

## Session Log

### 2026-03-20 - 项目状态摸底
- ✅ 读取 PRD 文档（WordPet_PRD_v1.3_delivery.md）
- ✅ 读取技术规范（TECH_SPEC.md）
- ✅ 读取 CLAUDE.md 项目引导文件
- ✅ 读取 README.md（Paraflow 技术栈文档）
- ✅ 探索前端页面实现情况
- ✅ 检查路由配置和页面链接
- ✅ 确认开发服务器运行状态（http://localhost:8000 ✅）
- ✅ 创建 .planning 规划文件

**发现**：
- 项目核心流程已基本搭建（启动→引导→首页→房间→答题→结算）
- 11 个页面中 8 个有实际功能实现，3 个为占位（Collection/Practice/Settings）
- 缺少的主要功能：初始动画、引导过场、剧情过场、拼图合成动画、音频系统
- 数据层（rooms config、words data）未在 Paraflow 的 data 目录下找到，可能内联在页面中
- Paraflow 架构与 PRD TECH_SPEC 有差异，需要适配

### 2026-03-20 - 需求变更 & 新规划
- ✅ 读取用户新需求：去掉拼图合成，改为 1 房间 4 关 4 家具
- ✅ 分析当前 Result.tsx 结算页实现（列表式，较普通）
- ✅ 分析 PRD 中结算页设计（7.3 节，拼图碎片+合成动画的详细设计）
- ✅ 分析 gameStore.ts 状态管理（localStorage + debounce 保存）
- ✅ 确认无现有登录/认证实现
- ✅ 更新 task_plan.md 为新的 5 阶段规划

**新规划优先级**：
1. ⭐ 炫酷家具解锁结算页（最高优先级）
2. 信息存储与登录功能
3. 初始动画 + 引导过场
4. 音频系统
5. 剧情过场系统

### 2026-03-20 - 难度等级分析 & 优先级调整
- ✅ 全面分析了难度等级系统的完成度（约 45%）
- ✅ 发现核心问题：题目硬编码、题型比例无差异化、无词汇配置文件、例句只有一套
- ✅ 根据用户要求，将**难度等级完善**提高优先级到 Phase 3（存储+登录之后）

**更新后的规划优先级**：
1. ⭐ Phase 1: 炫酷家具解锁结算页（最高优先级）
2. Phase 2: 信息存储与登录功能
3. 🔴 Phase 3: **难度等级系统完善**（新增，高优先级）
4. Phase 4: 初始动画 + 引导过场
5. Phase 5: 音频系统
6. Phase 6: 剧情过场系统

### 2026-03-20 - Phase 1 完成：炫酷家具解锁结算页
- ✅ 创建 `FurnitureReveal.tsx` 全屏家具解锁动画组件
  - 深色星空背景（radial-gradient + 30 颗闪烁星光）
  - 家具弹性缩放出场（cubic-bezier 弹簧曲线 0→1.15→0.95→1）
  - 24 颗金色粒子径向散射效果
  - 光晕扩散 + 呼吸动画 + 外环光圈
  - "✨ 新家具已解锁！✨" 金色标签 + 家具名称淡入
  - "恭喜获得新家具，房间更温馨了~" 副标题
  - 底部「太棒了！🎉」按钮
- ✅ 改造 `Result.tsx` 页面流程
  - 两阶段流程：reveal（动画）→ detail（结算详情）
  - 结算详情增加 detailSlideUp 依次入场动画
  - 家具解锁卡改为横排紧凑布局（缩小版作为回顾）
  - 新增 chapterFurnitureEmoji 映射表
- ✅ 编译通过，HMR 热更新正常，无运行时错误

**新增文件**：
- `frontend/src/pages/function/FurnitureReveal.tsx` - 家具解锁全屏动画组件

**修改文件**：
- `frontend/src/pages/function/Result.tsx` - 改造为两阶段流程

### 2026-03-20 - Phase 1.5 完成：本关单词模块优化
- ✅ Game.tsx 新增 `firstCorrect` 字段追踪首次答对状态
- ✅ Game.tsx 通过 route state 传递 `levelWordDetails` 给 Result 页面
  - 包含每个单词的 word、meaning、sentence、type、stats（含 firstCorrect）
- ✅ Result.tsx 完全重构「本关单词」区块
  - 三级掌握度系统：已掌握（绿）/ 需复习（黄）/ 未掌握（红）
  - 按掌握程度排序：未掌握 → 需复习 → 已掌握（薄弱单词置顶）
  - 每个单词卡展示：单词 + 中文释义 + 掌握标签 + 🔊发音按钮 + 展开箭头
  - 点击展开：例句 + 答题统计（答对/答错次数 + 一次通过标记）
  - 成绩卡新增掌握度概览统计条
  - 兜底逻辑：直接访问 URL 时从 wordHistory 回退展示
- ✅ 底部按钮改为 3 按钮布局：房间 / 再来一遍 / 下一关
- ✅ 新增 `expandIn` CSS 动画（展开详情入场效果）
- ✅ 编译通过，HMR 正常，无运行时错误

**修改文件**：
- `frontend/src/pages/function/Game.tsx` - 新增 firstCorrect 追踪 + route state 传递
- `frontend/src/pages/function/Result.tsx` - 完全重构本关单词区块

### 2026-03-20 - Phase 2 完成：信息存储与登录功能
- ✅ 后端数据库 schema 创建
  - `user_game_progress` 表（userId, gameState JSONB, version, timestamps）
  - Drizzle ORM schema 定义 + SQL 迁移文件
  - 更新 migrations.ts 注册新迁移
- ✅ 后端 API 路由实现
  - `GET /api/game-state` - 获取当前用户游戏进度
  - `POST /api/game-state` - 保存/更新游戏进度（upsert by userId）
  - `ALL /api/auth/*` - Auth 代理路由（转发到 auth gateway）
  - 支持从 auth session 获取 userId 进行权限验证
- ✅ 前端 Auth 服务层（authStore.ts）
  - signIn / signUp / signOut / getSession API 封装
  - saveGameStateToServer / loadGameStateFromServer 数据同步 API
  - localStorage 缓存用户信息（离线可用）
- ✅ 前端 AuthContext 全局认证状态
  - AuthProvider 挂载在 App.tsx 顶层
  - useAuth hook 提供 user / isLoggedIn / refreshSession / logout
  - 启动时自动检查 session
- ✅ 登录/注册页面（Login.tsx）
  - 登录/注册 Tab 切换
  - 邮箱 + 密码 + 昵称（注册时）表单
  - 错误提示、loading 状态
  - 登录成功后自动同步 gameState 到云端
  - "暂不登录，以游客身份继续" 跳过选项
- ✅ GameContext 数据同步改造
  - 双模式保存：localStorage（300ms debounce）+ 云端（1.5s debounce）
  - syncStatus 状态：idle / syncing / synced / error
  - loadFromCloud 合并策略：比较 completedLevels 数量取更多进度的版本
  - 同级别时合并 wordHistory（取答题次数更多的记录）
  - 启动时自动尝试云端同步（已登录用户）
- ✅ Profile 页面更新
  - 已登录：显示用户信息 + 邮箱 + 同步状态徽章 + 登出按钮
  - 未登录：云同步引导横幅「注册账号后，换设备也能继续你的故事 →」
  - SyncStatusBadge 组件（idle/syncing/synced/error 四种状态）
- ✅ 路由系统更新
  - pageLinks 新增 Login: () => '/login'
  - routes.ts 注册 Login 页面
- ✅ 编译通过，HMR 正常，无运行时错误

**新增文件**：
- `backend/src/api/gameState.ts` - 游戏进度 API
- `backend/src/api/auth.ts` - Auth 代理 API
- `backend/drizzle/0001_user_game_progress.sql` - 数据库迁移
- `frontend/src/store/authStore.ts` - Auth 服务封装
- `frontend/src/store/AuthContext.tsx` - 全局认证 Context
- `frontend/src/pages/function/Login.tsx` - 登录/注册页面

**修改文件**：
- `backend/src/schema.ts` - 新增 userGameProgress 表定义
- `backend/src/app.ts` - 注册 auth + game-state 路由
- `backend/drizzle/migrations.ts` - 注册新迁移
- `frontend/src/App.tsx` - 集成 AuthProvider
- `frontend/src/store/GameContext.tsx` - 添加云同步逻辑
- `frontend/src/pages/function/Profile.tsx` - 添加登录状态/云同步 UI
- `frontend/src/pageLinks.ts` - 新增 Login 链接
- `frontend/src/routes.ts` - 注册 Login 路由

### 2026-03-20 - Phase 3 完成：难度等级系统完善
- ✅ 创建词汇数据层 `frontend/src/data/words/`
  - `types.ts` - WordConfig 接口、SentencePair 类型、getSentence() / getDistractors() 核心函数
  - `chapter1.ts` - 15 词（街角流浪：cat, box, rain, door, bag, cold, food, wet, run, help, night, warm, sad, hand, home）
  - `chapter2.ts` - 15 词（温暖新家：sofa, lamp, book, cup, mat, bed, clock, window, pillow, shelf, carpet, mirror, table, chair, key）
  - `chapter3.ts` - 15 词（幼儿园：desk, pen, ball, cake, draw, color, song, play, star, name, rule, smile, time, doll, milk）
  - `chapter4.ts` - 15 词（公园探险：tree, duck, park, friend, happy, bird, flower, fish, grass, sky, walk, water, stone, wind, leaf）
  - `chapter5.ts` - 15 词（厨房美食：cook, rice, bread, knife, taste, egg, fruit, spoon, plate, sweet, bowl, hot, clean, fork, mix）
  - `index.ts` - 导出 chapterWordsMap + getChapterWords() 工具函数
  - 每个单词含：word, meaning, pos, image, sentences.basic/advanced, categoryDistractors, spellingDistractors, semanticDistractors
- ✅ 创建难度配置层 `frontend/src/data/difficulty/`
  - `questionTypeRatios.ts` - PRD 指定的 4 级题型比例配置表 + Fisher-Yates 洗牌分配
  - `index.ts` - 统一导出
  - 5 种题型：picture_matching, letter_match, word_spelling, fill_blank, multiple_choice
- ✅ 创建题目生成引擎 `frontend/src/data/questionGenerator.ts`
  - GeneratedQuestion 接口（type, word, meaning, pos, sentence, sentenceZh, options, correctAnswer, image, letters?, matchPairs?）
  - 5 种题型各自的生成器函数
  - generateQuestions() 主入口：按难度比例分配题型 → 优先未掌握单词 → 穿插复习
  - adjustNextQuestion() 题内微调：根据最近 3 题正确率决定下一题难度调整
  - applyAdjustment() 应用调整：切换例句难度 + 调整干扰项策略
- ✅ 重构 Game.tsx
  - 移除硬编码 QUESTIONS 数组（原 10 道固定题）
  - useEffect 调用 generateQuestions() 动态生成题目
  - 新增 LetterPuzzle 组件（字母消消乐 + 拼写题共用的 tap-to-select 交互）
  - 题内自适应追踪（recentResults useRef，sentenceLevelOverride useState）
  - header 显示当前难度等级指示器（爪印 emoji）
  - 5 种题型条件渲染：图片配对、字母拼写、拼写输入、填空选择、多选题
  - 保持既有 UI 模式：FeedbackSheet、ConfirmDialog、TTS 朗读、弹性动画
- ✅ 实现 Settings.tsx（从占位页面变为完整功能页面）
  - 「学习设置」分组：可展开的难度选择器（4 级 × emoji + 标题 + 副标题）
  - 「音频设置」分组：背景音乐开关 + 音效 & 朗读开关（自定义 toggle 组件）
  - 「关于」分组：版本信息展示
  - 修改难度后同步更新 gameState.difficulty + adaptiveDifficulty.base/current
- ✅ TypeScript 编译通过（新增代码无类型错误）
- ✅ HMR 热更新正常，无运行时错误

**新增文件**：
- `frontend/src/data/words/types.ts` - 词汇类型定义 + 核心工具函数
- `frontend/src/data/words/chapter1.ts` - 第 1 章 15 个单词配置
- `frontend/src/data/words/chapter2.ts` - 第 2 章 15 个单词配置
- `frontend/src/data/words/chapter3.ts` - 第 3 章 15 个单词配置
- `frontend/src/data/words/chapter4.ts` - 第 4 章 15 个单词配置
- `frontend/src/data/words/chapter5.ts` - 第 5 章 15 个单词配置
- `frontend/src/data/words/index.ts` - 词汇数据统一导出
- `frontend/src/data/difficulty/questionTypeRatios.ts` - 题型比例配置
- `frontend/src/data/difficulty/index.ts` - 难度配置统一导出
- `frontend/src/data/questionGenerator.ts` - 题目动态生成引擎

**修改文件**：
- `frontend/src/pages/function/Game.tsx` - 完全重构：动态题目生成 + 5 题型 + LetterPuzzle + 题内微调
- `frontend/src/pages/function/Settings.tsx` - 完全重构：难度调整 + 音频开关 + 版本信息

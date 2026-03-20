# WordPet（猫猫冒险游记）- 任务计划

## 项目概述
- **产品**：WordPet - 故事驱动的英语单词学习应用
- **技术栈**：Paraflow monorepo（React 19 + Jotai + Hono + Drizzle + Vite + Tailwind）
- **PRD 版本**：v1.3
- **服务状态**：开发服务器运行在 http://localhost:8000

---

## 🔄 v2 需求调整（比赛版本）

### 关键变更
1. **去掉拼图合成功能**：不再有 4 片拼图碎片 → 合成家具的流程
2. **简化为**：1 个房间 → 4 关 → 每关直接解锁 1 件家具
3. **结算页升级**：当前列表式完成页太普通，需要更炫酷的家具解锁展示效果
4. **新增信息存储 + 登录功能**
5. **难度等级完善**：当前难度选择无实际效果（题目硬编码），需要实现 PRD 中的三维差异化
6. **后续补全**：初始动画 + 引导过场、音频系统、剧情过场系统

---

## 当前完成情况总结

### ✅ 已完成（有实际功能实现）

| 页面/功能 | 文件 | 行数 | 状态 | 说明 |
|-----------|------|------|------|------|
| 首页 | Home.tsx | ~585行 | ✅ complete | 房间卡片列表、进度展示、导航 |
| 启动页 | Splash.tsx | ~125行 | ✅ complete | Logo、加载动画、自动跳转 |
| 猫咪自定义 | Onboarding.tsx | ~170行 | ✅ complete | 外观/性别/性格选择、命名 |
| 英语水平选择 | OnboardingLevel.tsx | ~82行 | ✅ complete | 4级难度选择 |
| 答题游戏 | Game.tsx | ~1035行 | ✅ complete | 多题型、自适应难度、反馈机制、TTS |
| 关卡结算 | Result.tsx | ~359行 | ✅ complete | 正确率统计、家具解锁（列表式，需改造） |
| 房间详情 | Room.tsx | ~703行 | ✅ complete | 房间全景、家具展示、关卡进度 |
| 个人主页 | Profile.tsx | ~331行 | ✅ complete | 猫咪信息、学习统计 |
| 路由系统 | routes.ts + pageLinks.ts | - | ✅ complete | 完整路由配置 |

### ⏳ 占位页面（Coming Soon）

| 页面 | 文件 | 状态 |
|------|------|------|
| 图鉴 | Collection.tsx | ⏳ placeholder |
| 练习 | Practice.tsx | ⏳ placeholder |
| 设置 | Settings.tsx | ✅ complete（Phase 3 实现） |

---

## 🎯 新的开发阶段规划

### Phase 1: 炫酷家具解锁结算页 - `complete` ⭐ 最高优先级
> 目标：关卡完成时，解锁的家具以震撼的动画效果优先弹出，替代当前普通的列表展示

**设计思路**：
- 完成答题后，先弹出全屏家具解锁动画（遮罩层）
- 家具图从中央以弹性缩放 + 粒子/光效出场
- 动画结束后过渡到结算信息页（正确率、单词回顾等）

**任务分解**：
- [x] 1.1 设计家具解锁动画组件 `FurnitureReveal`
  - 全屏深色遮罩背景（radial-gradient 星空感）+ 30 颗闪烁星光
  - 家具图从 scale(0) 弹性放大到 scale(1)（cubic-bezier(.34,1.56,.64,1)），配合光晕扩散
  - 24 颗金色粒子散射效果（径向散射 + 渐隐）
  - 家具名称淡入 + "✨ 新家具已解锁！✨" 金色标签
  - 「恭喜获得新家具，房间更温馨了~」副标题动画
  - 底部「太棒了！🎉」按钮，点击后进入结算详情
- [x] 1.2 改造 Result.tsx 页面流程
  - 进入结算页时，先展示 FurnitureReveal 全屏动画（stage: reveal）
  - 点击继续后，平滑过渡到结算详情页（stage: detail）
  - 结算详情增加 detailSlideUp 入场动画
  - 家具解锁卡改为横排紧凑布局（56px 小图 + 名称 + "已放入房间"）
  - 底部保留「返回房间」和「下一关」按钮
- [x] 1.3 CSS 动画实现
  - @keyframes furniturePopIn：弹性缩放（0→1.15→0.95→1）
  - @keyframes glowPulse + glowBreath：光晕扩散 + 呼吸效果
  - @keyframes ringExpand：外环光圈扩散
  - @keyframes particleBurst：粒子径向散射（CSS custom property --tx/--ty）
  - @keyframes starTwinkle：背景星光闪烁
  - @keyframes badgeFadeIn / nameFadeUp：文字入场
  - @keyframes detailSlideUp：结算详情区块依次上浮入场
- [x] 1.4 适配当前数据结构
  - 1 房间 4 关 4 家具映射（chapterFurnitureMap + chapterFurnitureEmoji）
  - furnitureUnlocked 状态判断 → 控制 reveal/detail 初始阶段
  - 图片加载失败时 fallback 到 emoji

### Phase 1.5: 本关单词模块优化 - `complete`
> 目标：优化结算页「本关单词」区块，补充缺失信息，增强复习体验

**P0 — 信息完整性**：
- [x] 1.5.1 Game.tsx 传递本关答题数据到 Result（route state + firstCorrect 追踪）
- [x] 1.5.2 单词卡加上中文释义
- [x] 1.5.3 区分「已掌握 / 需复习 / 未掌握」三级掌握度 + 按掌握度排序 + 成绩卡概览统计

**P1 — 复习体验**：
- [x] 1.5.4 每个单词旁加发音按钮（TTS）
- [x] 1.5.5 点击单词卡展开详情（例句 + 答题统计 + 一次通过标记）
- [x] 1.5.6 底部增加「再来一遍」按钮（3 按钮：房间 / 再来一遍 / 下一关）

### Phase 2: 信息存储与登录功能 - `complete`
> 目标：将游戏进度存储到服务端，支持用户登录认证，实现多设备数据同步

**技术方案**：
- 使用项目已有的 Hono + Drizzle + PGLite 后端架构
- 内置 Auth 系统（fake auth in prototype mode, real auth in production）
- 后端创建 gameState 存储 API（基于 userId）
- 前端改造 gameStore 支持双模式：离线 localStorage + 在线云同步

**任务分解**：
- [x] 2.1 技术方案评估与决策
  - 使用项目内置 auth gateway（fake in prototype, production in deploy）
  - 后端使用 Hono API 存储用户进度到 PostgreSQL/PGLite
  - gameState schema 保持不变，整体作为 JSONB 存储
- [x] 2.2 创建数据库 schema（用户进度表）
  - `user_game_progress` 表：id (UUID PK), userId (unique), gameState (JSONB), version, timestamps
  - Drizzle ORM schema + SQL 迁移文件
- [x] 2.3 创建后端 API 路由
  - `GET /api/game-state` - 获取当前用户的游戏进度（auth required）
  - `POST /api/game-state` - 保存/更新游戏进度（upsert by userId）
  - `ALL /api/auth/*` - Auth 代理路由转发到 auth gateway
- [x] 2.4 实现登录认证
  - 创建 Login.tsx 登录/注册页面（邮箱+密码）
  - authStore.ts 封装 signIn/signUp/signOut/getSession API
  - AuthContext.tsx 全局认证状态管理
  - App.tsx 集成 AuthProvider
- [x] 2.5 前端改造 - 数据同步逻辑
  - GameContext 增加 syncToCloud / loadFromCloud 方法
  - 每次 updateGameState 自动保存到 localStorage + 云端（双 debounce）
  - 合并策略：比较 completedLevels 数量取更多进度的版本
  - 启动时自动尝试云端同步（已登录用户）
  - 离线容错：服务端不可用时 fallback 到 localStorage
- [x] 2.6 Profile 页面更新
  - 已登录：用户信息 + 邮箱 + SyncStatusBadge + 登出按钮
  - 未登录：引导登录横幅「注册账号后，换设备也能继续你的故事 →」
  - syncStatus 四态：idle / syncing / synced / error

### Phase 3: 难度等级系统完善 - `complete` ✅
> 目标：让用户选择的英语水平真正影响游戏体验，实现 PRD 中的三维差异化设计

**已解决的问题**：
- ✅ 题目数据硬编码 → 动态生成引擎（5 章节 × 15 词 = 75 个词汇）
- ✅ 题型比例根据难度动态调整（PRD 指定比例配置表）
- ✅ 双套例句系统（basic/advanced）根据难度自动选择
- ✅ 三层干扰项策略（category / spelling / semantic）
- ✅ 词汇配置文件（5 章节独立文件 + 完整 WordConfig 结构）
- ✅ 题内实时微调（每 3 题根据正确率调整例句难度 + 干扰项策略）

**任务分解**：
- [x] 3.1 创建词汇数据配置文件
  - 创建 `frontend/src/data/words/` 目录（types.ts + chapter1-5.ts + index.ts）
  - 每章节 15 个单词，WordConfig 结构（word, meaning, pos, image, sentences.basic/advanced）
  - 每个单词配置 3 类干扰项：categoryDistractors、spellingDistractors、semanticDistractors
- [x] 3.2 创建难度配置文件
  - `frontend/src/data/difficulty/questionTypeRatios.ts` - 4 级题型比例配置
  - getQuestionTypeDistribution() - Fisher-Yates 洗牌生成题目类型序列
  - 干扰项策略集成在 words/types.ts 的 getDistractors() 函数中
- [x] 3.3 重构 Game.tsx 题目生成逻辑
  - 移除硬编码 QUESTIONS 数组，改用 generateQuestions() 动态生成
  - 支持 5 种题型：picture_matching、letter_match、word_spelling、fill_blank、multiple_choice
  - 新增 LetterPuzzle 组件（字母消消乐 + 拼写题共用）
  - 优先出未掌握单词，穿插复习已掌握单词
- [x] 3.4 实现题内实时微调（每 3 题调整）
  - recentResults ref 追踪最近 3 题正确率
  - 正确率 ≥ 67% → 例句切换 advanced + 干扰项增强
  - 正确率 ≤ 33% → 例句切换 basic + 干扰项降低
  - adjustNextQuestion() + applyAdjustment() 动态调整下一题
- [x] 3.5 Settings 页面添加难度调整入口
  - Settings.tsx 完整实现（不再是 Coming Soon）
  - 可展开的难度选择器（4 级，含 emoji + 描述）
  - 音乐/音效开关 + 关于信息
  - 修改后更新 gameState.difficulty + adaptiveDifficulty.base/current

### Phase 4: 初始动画 + 引导过场 - `pending`
> 目标：首次启动流程完整性

**任务分解**：
- [ ] 3.1 初始动画 `/intro` 页面
  - 全屏黑色背景
  - 猫咪小图从屏幕底部缓缓走入，停在中央
  - 旁白文字依次淡入：
    - 「有一只小猫……」
    - 「它在等待，一个属于自己的家。」
    - 「而那个家，需要你来建造。」
  - 右上角「跳过」按钮
  - 动画播完后自动跳转 `/onboarding/level`
- [ ] 3.2 引导过场 `/onboarding/story`
  - 猫咪被路人捡回家的剧情
  - PPT 多图 + 配乐形式
  - 复用 StoryPlayer 组件（Phase 5 实现）
  - 简化版本：图片 + 文字叙述 + 自动翻页

### Phase 5: 音频系统（BGM + 音效）- `pending`
> 目标：为应用添加声音层，增强沉浸感

**任务分解**：
- [ ] 4.1 音频管理器 `AudioManager`
  - 单例模式，全局 BGM 控制
  - 支持淡入/淡出切换
  - 响应 settings.musicEnabled / settings.soundEnabled
- [ ] 4.2 BGM 集成
  - 首页 BGM
  - 答题页 BGM
  - 结算页音效（家具解锁音效）
- [ ] 4.3 点击音效
  - 全局按钮点击反馈音
  - 答题正确/错误音效
- [ ] 4.4 设置页实现
  - 音乐开关
  - 音效开关
  - 存入 gameState.settings

### Phase 6: 剧情过场系统 - `pending`
> 目标：章节故事叙述

**任务分解**：
- [ ] 5.1 StoryPlayer 组件
  - PPT 式多图播放器
  - 支持字幕文字叠加
  - 左右滑动/点击翻页
  - 背景配乐
  - 右上角「跳过」按钮
- [ ] 5.2 章节过场 `/chapter/:id/story`
  - 每章节 3-6 张剧情图片
  - 配合文字叙述
  - 章节完成后自动触发
- [ ] 5.3 引导过场复用
  - `/onboarding/story` 复用 StoryPlayer 组件

---

## 技术决策

### 继续使用 Paraflow 架构
- React 19 + BrowserRouter + Jotai（不回退到 PRD 的 React 18 + HashRouter + Context）
- gameState 继续使用 localStorage（登录后增加服务端同步）
- 样式使用 inline styles + CSS animations（项目已有的模式）

### 结算页改造策略
- **不删除**现有 Result.tsx 的统计展示功能
- **新增** FurnitureReveal 动画组件，作为结算页的第一屏
- 用户流程：答题完成 → 家具解锁动画（全屏） → 点击继续 → 结算详情

### 数据结构调整
- 去掉拼图碎片概念，每关直接解锁一件家具
- `unlockedFurniture` 数组继续使用，格式：`furniture_ch{n}_lv{m}`
- 每个房间 4 关对应 4 件独立家具（不再是 4 片碎片合成 1 件）

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
| 设置 | Settings.tsx | ⏳ placeholder |

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

### Phase 2: 信息存储与登录功能 - `pending`
> 目标：将游戏进度存储到服务端，支持用户登录

**任务分解**：
- [ ] 2.1 评估存储方案
  - 当前使用 localStorage 存储 gameState
  - 需要接入后端（Paraflow 自带 Hono + Drizzle）或使用统一登录
  - 确认是否使用 Rush 平台的 unified-login 还是自建登录
- [ ] 2.2 接入登录认证
  - 调用 unified-login-add workflow
  - 或自建简单的用户认证系统
- [ ] 2.3 实现数据同步
  - 登录后将 localStorage 数据同步到服务端
  - 支持多设备同步
  - 离线时继续使用 localStorage，联网后自动同步

### Phase 3: 难度等级系统完善 - `pending` 🔴 高优先级
> 目标：让用户选择的英语水平真正影响游戏体验，实现 PRD 中的三维差异化设计

**当前问题分析**：
- ❌ 题目数据硬编码在 Game.tsx 中（10 道固定题目），难度选择无实际效果
- ❌ 未实现题型比例根据难度动态调整
- ❌ 未实现双套例句系统（basic/advanced）
- ❌ 未实现干扰项难度策略
- ❌ 未创建词汇配置文件
- ⚠️ AI 自适应只在关卡结束后调用，未实现题内实时微调

**难度等级完成度：约 45%**（基础设施已有，核心逻辑缺失）

**任务分解**：
- [ ] 3.1 创建词汇数据配置文件
  - 创建 `frontend/src/data/words/` 目录
  - 每章节独立文件：`chapter1.ts`、`chapter2.ts` 等
  - 每个单词配置 WordConfig 结构（word, meaning, pos, image, sentences.basic, sentences.advanced）
  - 第 1 章 4 关，每关至少 10 个单词（含干扰项词汇）
- [ ] 3.2 创建难度配置文件
  - 创建 `frontend/src/data/difficulty/` 目录
  - `questionTypeRatios.ts` - 4 个难度级别的题型比例配置表
    - 纯新手：图片配对 3、字母消消乐 3、拼写 2、填空 1、填字 1
    - 略知一二：均匀各 2 题
    - 勉强应付：填空 3、填字 2 为主
    - 还不错哦：填空 3、填字 3 为主
  - `distractorStrategies.ts` - 4 个难度级别的干扰项策略
    - 纯新手：差异大（sofa vs tree）
    - 略知一二：同类别（sofa vs chair vs desk）
    - 勉强应付：拼写相近（sofa vs sofe vs sopa）
    - 还不错哦：语义相近（sofa vs couch vs bench）
- [ ] 3.3 重构 Game.tsx 题目生成逻辑
  - 移除硬编码的 QUESTIONS 数组
  - 新建 `generateQuestions()` 函数
  - 根据 `gameState.adaptiveDifficulty.current` 读取对应的题型比例
  - 从词汇库中随机抽取单词，按比例生成各题型
  - 根据难度选择 basic/advanced 例句
  - 根据难度策略生成干扰项
- [ ] 3.4 实现题内实时微调（每 3 题调整）
  - 追踪最近 3 题正确率 + 答题速度
  - 正确率 ≥ 80% 且首次作答正确 → 例句切换 advanced
  - 正确率 ≤ 40% 或需要 2 次机会 → 例句切换 basic
  - 不在关内改变整体难度等级，只调整例句和干扰项
- [ ] 3.5 个人主页添加难度调整入口
  - Profile.tsx 中新增「修改英语水平」按钮
  - 点击后弹出或跳转到水平选择界面
  - 修改后更新 gameState.difficulty 和 adaptiveDifficulty.base

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

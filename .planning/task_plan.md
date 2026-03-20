# WordPet（猫猫冒险游记）- 任务计划

## 项目概述
- **产品**：WordPet - 故事驱动的英语单词学习应用
- **技术栈**：Paraflow monorepo（React 19 + Jotai + Hono + Drizzle + Vite + Tailwind）
- **PRD 版本**：v1.3
- **服务状态**：开发服务器运行在 http://localhost:8000 ✅

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
| 关卡结算 | Result.tsx | ~359行 | ✅ complete | 正确率统计、家具解锁、拼图碎片 |
| 房间详情 | Room.tsx | ~703行 | ✅ complete | 房间全景、家具展示、关卡进度 |
| 个人主页 | Profile.tsx | ~331行 | ✅ complete | 猫咪信息、学习统计 |
| 路由系统 | routes.ts + pageLinks.ts | - | ✅ complete | 完整路由配置 |

### ⏳ 占位页面（Coming Soon）

| 页面 | 文件 | 状态 | PRD 优先级 |
|------|------|------|------------|
| 图鉴 | Collection.tsx | ⏳ placeholder | 低 - 弹窗模式 `?modal=rooms` |
| 练习 | Practice.tsx | ⏳ placeholder | 低 - 后续迭代 |
| 设置 | Settings.tsx | ⏳ placeholder | 中 - 音乐/音效开关 |

### ❌ 尚未实现的功能

| 功能 | PRD 章节 | 优先级 | 说明 |
|------|---------|--------|------|
| 初始动画 `/intro` | 6.2 | 中 | 猫咪从黑暗走出动画 |
| 引导过场 `/onboarding/story` | 6.5 | 中 | 猫咪被捡回家的剧情 |
| 剧情过场 `/chapter/:id/story` | 第9节 | 中 | PPT多图+配乐，StoryPlayer 组件 |
| 拼图合成动画 | 7.3 | 高 | 碎片飞入+家具揭示的完整动画 |
| 家具飘落动画 | 8.5 | 中 | 合成后返回房间的入场动画 |
| 坐标调试工具 | 8.6 | 低 | 开发辅助 |
| 设置弹窗 | 7.1 | 中 | 音乐/音效开关 |
| BGM 音频系统 | 11.7 | 中 | 背景音乐播放、淡入淡出 |
| 点击音效 | 11.7 | 低 | 全局点击反馈音 |

### 🔍 需要确认的技术差异

PRD 中的 TECH_SPEC 描述了 **React 18 + HashRouter + Context + 独立CSS** 方案，但实际项目使用的是 **Paraflow monorepo**（React 19 + BrowserRouter + Jotai + Tailwind）。需要确认：

1. **路由方式**：PRD 要求 HashRouter，实际用 BrowserRouter（Paraflow 默认）
2. **状态管理**：PRD 要求 React Context + localStorage，实际框架是 Jotai
3. **样式方案**：PRD 要求独立 CSS 文件，实际似乎使用了 Tailwind
4. **后端**：PRD 为纯前端应用，但 Paraflow 有完整后端（Hono + Drizzle）
5. **数据层**：PRD 中定义的 `src/data/rooms/`、`src/data/words/` 等数据文件尚未创建

---

## 待办阶段

### Phase 1: 核心功能补全 - `pending`
- [ ] 确认技术方案差异（Paraflow vs PRD 的 TECH_SPEC）
- [ ] 补全数据层（rooms config、words data、catDialogue）
- [ ] 完善 gameState 存储（当前实现方式确认）
- [ ] 补全初始动画 `/intro` 页面
- [ ] 补全引导过场 `/onboarding/story`
- [ ] 实现设置弹窗（音乐/音效开关）

### Phase 2: 视觉体验提升 - `pending`
- [ ] 拼图碎片合成动画（结算页核心体验）
- [ ] 家具飘落入场动画
- [ ] 剧情过场系统（StoryPlayer 组件）
- [ ] 全局加载过渡动画（LoadingTransition）

### Phase 3: 音频与外部接口 - `pending`
- [ ] BGM 音频系统
- [ ] 点击音效
- [ ] TTS 朗读功能完善
- [ ] AI 自适应难度引擎

### Phase 4: 辅助页面 - `pending`
- [ ] 图鉴弹窗
- [ ] 练习模块
- [ ] 设置页完善
- [ ] 个人主页优化

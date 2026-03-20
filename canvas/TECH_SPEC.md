# WordPet 技术架构规范 TECH_SPEC.md

> 本文档是给 AI 编程工具（Cursor / Paraflow）的技术决策说明。\
> 开发前必须阅读，确保所有生成代码符合以下规范。\
> 完整产品需求见同目录下的 `WordPet_PRD_v1.3_delivery.md`。

***

## 1. 技术栈选型

| 层级   | 选型                               | 说明                            |
| ---- | -------------------------------- | ----------------------------- |
| 框架   | **React 18 + TypeScript**        | 组件化，Cursor 生成质量最稳定            |
| 构建工具 | **Vite**                         | 启动快，配置简单，零基础友好                |
| 路由   | **React Router v6（HashRouter）**  | HashRouter 兼容静态部署，无需服务端配置     |
| 样式   | **独立 CSS 文件**（非 CSS Modules）     | 每个组件对应一个 `.css` 文件，Paper 微调友好 |
| 状态管理 | **React Context + localStorage** | 不引入 Redux 等复杂库，保持简单           |
| HTTP | **原生 fetch**                     | 调用比赛提供的 TTS / LLM 接口          |
| 部署   | **Paraflow 托管 或 Vercel**         | 静态部署，评委直接打开链接                 |

**禁止引入：** Redux、MobX、Styled-components、Tailwind、任何 UI 组件库

***

## 2. 项目目录结构

```text
wordpet/
├── public/
│   └── assets/                    # 所有静态资源
│       ├── home/
│       │   └── bg_bottom.png      # 首页底部场景图
│       ├── rooms/
│       │   └── ch{n}/
│       │       ├── bg.jpg         # 房间图（375×202pt @3x）
│       │       ├── frame.png      # 房间边框（311×187pt @3x）
│       │       └── furniture/
│       │           └── lv1/
│       │               ├── piece_0~3.png
│       │               └── full.png
│       ├── cat/
│       │   └── appearance_{n}_{personality}_{m|f}.png  # 24张
│       ├── words/
│       │   └── {word}.png         # 25张单词配图
│       ├── audio/
│       │   ├── bgm-home.mp3
│       │   ├── bgm-game.mp3
│       │   └── sfx-click.mp3
│       └── ui/
│           ├── home-icon.png
│           ├── buttons/
│           │   └── btn-quick-start.png
│           └── icons/
│               └── *.svg
├── src/
│   ├── main.tsx                   # 入口文件
│   ├── App.tsx                    # 路由配置
│   ├── styles/
│   │   ├── tokens.css             # 全局设计 token（颜色/间距/圆角）
│   │   ├── home.css               # 首页样式
│   │   ├── game.css               # 答题页样式
│   │   ├── result.css             # 结算页样式
│   │   └── story.css              # 过场页样式
│   ├── pages/
│   │   ├── Splash/                # 启动页
│   │   ├── Intro/                 # 初始动画
│   │   ├── OnboardingLevel/       # 英语水平选择
│   │   ├── Onboarding/            # 猫咪自定义
│   │   ├── Home/                  # 首页
│   │   ├── Room/                  # 房间详情
│   │   ├── Game/                  # 答题页
│   │   ├── Result/                # 结算页
│   │   └── Story/                 # 剧情过场
│   ├── components/
│   │   ├── RoomScene/             # 房间渲染组件
│   │   │   ├── RoomScene.tsx
│   │   │   └── RoomScene.css
│   │   ├── PuzzleResult/          # 拼图碎片+合成动画
│   │   │   ├── PuzzleResult.tsx
│   │   │   └── PuzzleResult.css
│   │   ├── StoryPlayer/           # 剧情过场播放器
│   │   │   ├── StoryPlayer.tsx
│   │   │   └── StoryPlayer.css
│   │   ├── WordQuestion/          # 答题题型组件
│   │   │   ├── WordQuestion.tsx
│   │   │   └── WordQuestion.css
│   │   ├── FeedbackSheet/         # 答题反馈底部弹窗
│   │   │   ├── FeedbackSheet.tsx
│   │   │   └── FeedbackSheet.css
│   │   ├── LoadingTransition/     # 全局加载动画（Learn/play/purr）
│   │   │   ├── LoadingTransition.tsx
│   │   │   └── LoadingTransition.css
│   │   └── BottomNav/             # 底部导航栏
│   │       ├── BottomNav.tsx
│   │       └── BottomNav.css
│   ├── store/
│   │   ├── gameStore.ts           # localStorage 读写（唯一入口）
│   │   ├── migrate.ts             # 数据版本迁移
│   │   └── GameContext.tsx        # React Context 全局状态
│   ├── data/
│   │   ├── rooms/
│   │   │   ├── chapter1.ts        # 第1章 roomConfig
│   │   │   └── chapter2~5.ts
│   │   ├── words/
│   │   │   ├── chapter1.ts        # 第1章单词+例句（双套）
│   │   │   └── chapter2~5.ts
│   │   └── catDialogue.ts         # 猫咪对话文案（6种组合）
│   ├── services/
│   │   ├── tts.ts                 # TTS 接口封装
│   │   └── llm.ts                 # LLM 接口封装（自适应难度）
│   └── hooks/
│       ├── useGameStore.ts        # 读写 gameState 的 hook
│       ├── useAnimation.ts        # 动画降级检测
│       └── useAdaptiveDifficulty.ts  # 自适应难度逻辑
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

***

## 3. 路由配置

```tsx
// src/App.tsx
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
function App() {
  const { gameState } = useGameStore();
  const isFirstTime = !gameState || !gameState.onboardingDone;
  return (
    <HashRouter>
      <Routes>
        {/* 新手引导（仅首次） */}
        <Route path="/splash" element={<Splash />} />
        <Route path="/intro" element={<Intro />} />
        <Route path="/onboarding/level" element={<OnboardingLevel />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/onboarding/story" element={<OnboardingStory />} />
        {/* 主流程 */}
        <Route path="/" element={<Home />} />
        <Route path="/rooms/:chapterId" element={<Room />} />
        <Route path="/chapter/:chapterId/level/:levelId" element={<Game />} />
        <Route path="/chapter/:chapterId/level/:levelId/result" element={<Result />} />
        <Route path="/chapter/:chapterId/story" element={<Story />} />
        {/* 其他 */}
        <Route path="/profile" element={<Profile />} />
        {/* 默认跳转 */}
        <Route path="*" element={<Navigate to={isFirstTime ? "/splash" : "/"} />} />
      </Routes>
    </HashRouter>
  );
}
```

***

## 4. 状态管理

```typescript
// src/store/gameStore.ts
// 所有 localStorage 读写必须通过这个文件，禁止在组件内直接操作
const STORAGE_KEY = 'wordpet_state';
export function getGameState(): GameState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createDefaultState();
  return migrate(JSON.parse(raw));
}
export function saveGameState(state: GameState): void {
  // 防抖 300ms，避免频繁序列化
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
```

```tsx
// src/store/GameContext.tsx
// 全局状态通过 Context 传递，避免 prop drilling
const GameContext = createContext<GameContextType>(null!);
export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(getGameState);
  const updateGameState = (updater: (prev: GameState) => GameState) => {
    setGameState(prev => {
      const next = updater(prev);
      saveGameState(next);  // 同步写入 localStorage
      return next;
    });
  };
  return (
    <GameContext.Provider value={{ gameState, updateGameState }}>
      {children}
    </GameContext.Provider>
  );
}
```

***

## 5. API 接口封装

> 比赛提供了以下两个接口，WordPet 只使用 01 和 02。

### 01 LLM 对话接口（用于 AI 自适应难度）

OpenAI SDK 兼容，直接替换 `base_url` 和 `api_key` 即可。

```typescript
// src/services/llm.ts
const LLM_CONFIG = {
  // 国内节点（用 DeepSeek / 豆包）
  baseURL: 'https://ai-platform-test.zhenguanyu.com/litellm/v1',
  // 海外节点（用 Claude / GPT / Gemini）
  // baseURL: 'https://ai-platform-test.zhenguanyu.com/litellm-oversea/v1',
  apiKey: 'sk-ZDolX3R••••••••••••••',  // 从比赛平台复制真实 key
  model: 'doubao-seed-1.8',            // 最便宜，适合频繁调用的自适应判断
};
// AI 自适应难度：根据最近答题表现，判断难度调整方向
export async function getAdaptiveAdjustment(
  recentAccuracy: number,  // 最近3题正确率 0-1
  attemptCount: number,    // 本题用了几次机会 1 or 2
  currentDifficulty: 1 | 2 | 3 | 4
): Promise<'up' | 'down' | 'keep'> {
  const prompt = `
你是一个英语学习难度调整助手。
当前学生状态：
- 最近3题正确率：${Math.round(recentAccuracy * 100)}%
- 本题作答次数：${attemptCount}次
- 当前难度级别：${currentDifficulty}（1=最简单，4=最难）
请根据以上数据，判断下一题的难度调整方向。
只返回以下三个词之一，不要有其他内容：up / down / keep
`;
  const response = await fetch(`${LLM_CONFIG.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LLM_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: LLM_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 10,
      temperature: 0,
    }),
  });
  const data = await response.json();
  const result = data.choices?.[0]?.message?.content?.trim().toLowerCase();
  if (result === 'up' || result === 'down') return result;
  return 'keep';
}
```

### 02 TTS 语音合成（魔袋，用于单词朗读）

TTS 接口文档见魔袋接口文档，以下为封装模板（具体参数待培训后补充）：

```typescript
// src/services/tts.ts
// TODO: 培训后根据魔袋实际接口文档填写以下配置
const TTS_CONFIG = {
  baseURL: '',   // 魔袋 TTS 接口地址
  apiKey: '',    // 魔袋接口鉴权 key
};
// 朗读单词（用于点击单词图片 和 答错弹窗）
export async function speakWord(
  word: string,
  meaning?: string,
  sentence?: string
): Promise<void> {
  if (!TTS_CONFIG.baseURL) {
    // 接口未配置时降级：使用浏览器原生 Web Speech API
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    return;
  }
  const text = [word, meaning, sentence].filter(Boolean).join('. ');
  await fetch(TTS_CONFIG.baseURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TTS_CONFIG.apiKey}`,
    },
    body: JSON.stringify({ text, lang: 'en-US', rate: 0.9 }),
  });
}
```

> **降级策略：** TTS 接口未配置或调用失败时，自动降级为浏览器原生 `Web Speech API`（`window.speechSynthesis`），确保功能可用，开发阶段不会因接口未接入而阻塞进度。

***

## 6. 代码规范（每次提需必须附加）

```text
代码规范要求（每次必须遵守）：
1. 样式全部写在独立的 ComponentName.css，不写内联样式
2. 颜色/间距/圆角/阴影使用 styles/tokens.css 中的 CSS 变量
3. 组件状态（hover/active/disabled）用 className 切换，不用 JS 动态 style
4. 布局用 flex + gap 控制间距，避免用 margin 堆叠
5. 图片路径通过 props 传入，组件内不硬编码资产路径
6. CSS 文件中对「设计师常调项」添加「↓ 设计师常调」注释标注
7. 图片占位时显示色块 + 尺寸说明，布局不塌陷
8. 所有图片占位处用「🖼️ ASSET」注释标注，说明图片用途、尺寸规格和文件路径规范
9. 不引用任何外部图片 URL，所有图片资产通过本地路径引用
10. 如涉及 gameState 结构变更，同步更新 store/migrate.ts 的迁移逻辑
11. 所有模块间距、元素尺寸、内边距必须使用 tokens.css 中的间距变量，不得硬编码 px 数值
```

***

## 7. 部署方式

**推荐：Paraflow 自带托管**

* Paraflow 项目直接生成在线链接，提交链接即可

* 无需额外配置

**备选：Vercel**

```bash
npm install -g vercel
vercel --prod
# 生成 https://wordpet.vercel.app 类似的链接
```

**比赛要求：**

* 作品必须可运行、可交互、可展示

* 必须有存储模块（localStorage 已满足）

* 提交 Paraflow/Vercel 链接 + GitHub 仓库地址

***

## 8. 开发优先级（5天冲刺）

```text
Day 1（今天）：Paraflow 生成首页视觉骨架，Cursor 初始化项目结构
Day 2：答题页静态结构 + localStorage 存储接入
Day 3：答题逻辑（选项点击、反馈弹窗、进入下一题）
Day 4：结算页 + TTS 接口 + AI 自适应接口接入
Day 5：全流程联调 + 录制演示视频 + 写 README + 整理过程记录
```

**MVP 必做（不可砍）：**

* 首页房间列表

* 答题页（至少1种题型跑通）

* 关卡结算页

* localStorage 存储

**加分项（有时间再做）：**

* 猫咪自定义页

* TTS 朗读

* AI 自适应难度

***

*WordPet TECH_SPEC v1.0 · 配合 WordPet_PRD_v1.3_delivery.md 使用*

​
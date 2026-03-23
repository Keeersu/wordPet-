# WordPet · 猫猫冒险游记 🐱

> **Learn, play, purr.**
> 跟随一只小猫咪的成长旅程，用趣味游戏学习英语单词，见证它的家从空荡荡到温馨填满。

**团队：** 猫卷装修队
**参赛赛道：** 智启未来·AI致用挑战赛 · 非研发岗位组
**线上体验：** [word-pet-five.vercel.app](https://word-pet-five.vercel.app)
**代码仓库：** [github.com/Keeersu/wordPet-](https://github.com/Keeersu/wordPet-)

---

## 项目背景

传统词汇学习枯燥乏味，缺乏情感投入，进度感太抽象。WordPet 用「猫咪成长故事 + 房间从空到满」的视觉积累，把英语单词学习变成一段有温度的陪伴旅程。

**核心情感循环：**
```
进入关卡 → 完成单词游戏 → 解锁一件家具
→ 返回房间，看到家具出现在原位
→ 房间逐渐填满，驱动继续学习
```

---

## 系统概述

### 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript |
| 构建 | Vite |
| 路由 | React Router v6 |
| 样式 | Tailwind CSS v4 |
| 状态管理 | React Context + localStorage |
| 部署 | Vercel |

### 页面结构

| 页面 | 路由 | 说明 |
|------|------|------|
| 英语水平选择 | `/onboarding/level` | 新手引导第一步 |
| 猫咪自定义 | `/onboarding` | 选择外观、性别、性格，给猫咪起名 |
| 故事地图首页 | `/` | 展示所有章节房间，查看解锁进度 |
| 答题页 | `/chapter/:id/level/:id` | 四选一单词游戏，最多2次答题机会 |
| 关卡结算页 | `/chapter/:id/level/:id/result` | 展示正确率、解锁家具、本关单词回顾 |
| 房间详情页 | `/rooms/:chapterId` | 展示房间全景、关卡进度、家具收集状态 |
| 个人主页 | `/profile` | 猫咪信息、学习统计、冒险进度 |

### 章节内容

| 章节 | 主题 | 家具（4件） | 单词 |
|------|------|-------------|------|
| 1 | 街角流浪 | 纸箱小窝、旧报纸被、流浪猫碗、街角路灯 | cat, box, rain, door, bag |
| 2 | 温暖新家 | 柔软沙发、温暖地毯、小书架、落地灯 | sofa, lamp, book, cup, mat |
| 3 | 幼儿园 | 小课桌、彩色书包、黑板、积木玩具 | desk, pen, rule, ball, cake |
| 4 | 公园探险 | 公园长椅、小喷泉、花圃、路边秋千 | tree, duck, park, friend, happy |
| 5 | 厨房美食 | 小餐桌、料理台、香料架、小冰箱 | cook, rice, bread, knife, taste |

---

## 存储模块说明

所有游戏数据存储在浏览器 `localStorage`，key 为 `wordpet_state`，无需后端账号系统。

### 数据结构

```typescript
{
  version: "1.3",
  sessionId: string,           // 本次会话唯一ID
  cat: {
    name: string,              // 用户起的猫咪名字
    appearance: 1|2|3|4,      // 外观：橘猫/白猫/黑猫/折耳猫
    gender: 'male'|'female',
    personality: 'homebody'|'lively'|'mysterious'
  },
  onboardingDone: boolean,
  difficulty: 1|2|3|4,        // 当前难度级别
  currentChapter: number,      // 当前进行章节
  currentLevel: number,        // 当前进行关卡
  completedLevels: {
    // key格式：'chapterId-levelId'
    [key: string]: { accuracy: number, completedAt: string }
  },
  unlockedFurniture: string[], // 已解锁家具ID列表，格式：'furniture_ch{n}_lv{n}'
  wordHistory: {
    [word: string]: { correct: number, wrong: number, lastSeen: string }
  },
  settings: { musicEnabled: boolean, soundEnabled: boolean }
}
```

### 存储特性

- **防抖写入**：gameState 更新后 300ms 延迟写入，避免频繁序列化
- **版本迁移**：`store/migrate.ts` 负责旧数据向新版本迁移，老用户数据不丢失
- **降级兜底**：读取失败时自动重置为默认状态，不影响使用

---

## AI 使用说明

### 开发工具

| 工具 | 用途 |
|------|------|
| **Paraflow** | 生成页面视觉结构和静态代码 |
| **Cursor** | 接入游戏逻辑、gameState、页面跳转 |
| **Claude Sonnet 4.6** | 产品设计辅助、代码审查、逻辑规划、README撰写 |

### 开发工作流

```
Claude 规划功能逻辑
    ↓
Paraflow 生成页面视觉代码 → push 到 GitHub
    ↓
Cursor 接入 gameState 逻辑 → push 到 GitHub
    ↓
Vercel 自动部署
```

### AI 功能集成（进行中）

**LLM 自适应难度**（接入中）
- 使用比赛提供节点：`https://ai-platform-test.zhenguanyu.com/litellm/v1`
- 模型：`doubao-seed-1.8`
- 每关结束后根据正确率动态调整下一关难度

**TTS 单词朗读**（接入中）
- 每道题展示单词时自动朗读
- 答错第二次时朗读正确答案 + 例句
- 降级方案：浏览器原生 `window.speechSynthesis`

---

## 本地运行

```bash
# 克隆仓库
git clone https://github.com/Keeersu/wordPet-.git
cd wordPet-

# 安装依赖
cd apps/main/app-root/frontend
pnpm install

# 启动开发服务器
pnpm dev
# 浏览器打开 http://localhost:3000
```

---

## 视觉风格

**ChunkyToybox 风格**：白色描边、实色阴影、圆润形状、糖果色系

| 用途 | 色值 |
|------|------|
| 主色 暖黄 | `#FFB840` |
| 辅色 青绿 | `#4ECDC4` |
| 背景 奶白 | `#FFF8E7` |
| 正文 深棕 | `#5D4037` |
| 成功 绿 | `#66BB6A` |
| 错误 红 | `#EF5350` |

---

*WordPet · 猫卷装修队 · 2026*

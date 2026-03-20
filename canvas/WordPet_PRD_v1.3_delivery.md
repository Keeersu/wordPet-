# WordPet（猫猫冒险游记）产品需求文档

**版本：** v1.3
**更新日期：** 2026-03-15
**实现方式：** AI 编程工具（Cursor / Claude Code）+ Paper 视觉微调 + Nanobanana Pro 生图
**文档用途：** AI 编程工具提需 · 团队协作 · 正式 PRD 归档

> **v1.3 主要变更：**
> - 🧩 家具机制重写：拼图碎片制，4关解锁4片，集齐合成完整家具
> - 📋 结算页重写：`/result` 与 `/reveal` 合并为单页，拼图视觉优先级最高
> - 🖼️ 图片资产更新：每件家具从1张改为 4片碎片 PNG + 1张完整 PNG
> - 📐 新增 iOS Safe Area 全局规范（Dynamic Island + Home Indicator）
> - 🎨 按钮规范更新：深色背景下统一使用橘黄描边 + 橘黄文字样式
> - 📊 学习结构更新：每房间 4 关（原3关），每关解锁一片碎片
>
> **v1.2 变更（保留）：**
> - 🏠 房间系统：背景图 + 独立家具 PNG 叠加，坐标由设计师定义
> - 🎬 剧情过场：PPT 多图 + 配乐形式
> - 🖼️ 图片资产规范：尺寸、命名、路径、占位符策略
> - 🛠️ Paper / vibe coding 友好的组件结构

---

## 目录

1. [产品概述](#1-产品概述)
2. [目标用户](#2-目标用户)
3. [视觉风格规范](#3-视觉风格规范)
4. [图片资产规范](#4-图片资产规范)
5. [站点地图 & 页面清单](#5-站点地图--页面清单)
6. [新手引导与猫咪自定义](#6-新手引导与猫咪自定义)
7. [功能详述](#7-功能详述)
8. [房间 & 家具系统](#8-房间--家具系统)
9. [剧情过场系统](#9-剧情过场系统)
10. [状态数据模型](#10-状态数据模型)
11. [技术实现规范](#11-技术实现规范)
12. [章节内容规划](#12-章节内容规划)
13. [范围外（MVP 不包含）](#13-范围外mvp-不包含)

---

## 1. 产品概述

**WordPet** 是一款故事驱动的英语单词学习应用。用户跟随一只小猫咪的成长旅程——从街角流浪到被收养、逐渐长大——通过趣味小游戏学习英语单词，每完成一关解锁一件真实摆入房间的家具，见证猫咪的家从空荡荡到温馨填满的全过程。

### 核心情感循环

```
进入关卡 → 完成单词游戏
  → 结算页：解锁一片拼图碎片（底部碎片栏从左到右依次点亮）
  → 集齐 4 片后「立即合成」→ 碎片飞入拼合 → 完整家具炸开揭示
  → 返回房间，看到家具已出现在房间原位（成就感）
  → 房间逐渐填满的视觉进度（驱动继续学习）
```

### 核心问题

| # | 问题 |
|---|------|
| 1 | 传统词汇学习枯燥乏味，难以维持长期动力 |
| 2 | 学习者缺乏情感投入——现有工具像工具，不像体验 |
| 3 | 进度感太抽象，缺乏实质性、可见的积累成就 |

---

## 2. 目标用户

### 核心人群

- **年龄：** 18–35 岁
- **特征：** 有英语学习意愿，但缺乏持续动力的上班族 / 大学生
- **使用场景：** 碎片时间（通勤、午休），每次 5–10 分钟
- **驱动力：** 猫咪故事 + 房间从空到满的视觉积累，而非学业压力

### 排除人群

- **应试备考人群：** 需要系统刷题、词频排序，本产品不满足
- **儿童（12岁以下）：** 视觉风格可爱，但词汇难度与游戏复杂度不匹配

---

## 3. 视觉风格规范

### 品牌标识

| 项目 | 内容 |
|------|------|
| 产品名称 | **WordPet**（猫猫冒险游记） |
| Slogan | **Learn, play, purr.** |

**Slogan 在产品中的融入方式：**

| 场景 | 使用方式 |
|------|----------|
| 启动画面 | `WordPet` 逐字打出，`Learn, play, purr.` 三词依次淡入，结尾配一声轻柔猫咪「喵」 |
| 全局加载过渡动画 | `Learn` / `play` / `purr` 三词依次循环出现，全场景复用 |
| 自定义猫咪页底部按钮 | 文案「Let's purr! 🐾」 |
| 房间详情页底部按钮 | 文案「Let's purr!」（替代「开始」） |
| 右下角悬浮 PNG 按钮 | 图案内可含「Let's purr!」文字 |
| 全部通关结束页 | 「You learned, you played, you purred.」情感收尾文案 |

### App Icon 设计建议

**推荐方向：字母猫**
- 圆润猫咪头像，耳朵或眼睛由字母「W」构成
- 底色：`#FFB840` 暖橙黄
- 图形：深棕色线条，风格与 ChunkyToybox 整体一致
- 原则：icon 在 60×60pt 下仍清晰可辨，越简单辨识度越高

备选方向：
- **猫咪 + 对话泡**：小猫侧脸 + 气泡内写「ABC」，传达「猫在说英语」的趣味感
- **房子里的猫**：暖色小房子，窗口有猫耳探出，呼应建造家园主题（小尺寸下细节容易模糊，慎用）

### 风格方向

**ChunkyToybox 风格：** 白色描边、实色阴影（无模糊）、粗壮圆润的形状、糖果色系

### 主色调

| 用途 | 色值 |
|------|------|
| 主色 — 暖黄 | `#FFB840` |
| 主色 — 青绿 | `#4ECDC4` |
| 背景 — 奶白 | `#FFF8E7` |
| 正文 — 深棕 | `#5D4037` |
| 成功 — 绿 | `#66BB6A` |
| 错误 — 红 | `#EF5350` |

### 卡片统一视觉语言

```
圆角 12px + 粗边框 2px + 底部实色阴影 4px（同色系深色）
```

### 字体

- 英文：**Nunito**（加粗优先，圆润感）
- 中文：**PingFang SC**

### 动画原则

- 优先使用 `CSS transform`，避免改变 `width` / `opacity` 触发重排
- 低性能设备跳过装饰性动画，保障流畅度
- 全局维护 `prefersReducedAnimation` context

---

## 4. 图片资产规范

> 本节为 Nanobanana Pro 生图和后续上传替换的完整指引。AI 编程工具按此规范生成占位符，设计师完成生图后按路径替换即可，无需改动代码。

**全局设计基准说明：**

| 概念 | 说明 |
|------|------|
| 设计稿单位 | **375pt**（逻辑点），对应 CSS px，直接用于布局尺寸 |
| 图片导出倍率 | 所有图片统一 **@3x 导出**，规则简单，全机型清晰 |
| 坐标系 | 房间内元素坐标使用 **0–1 小数比例**，相对于容器宽/高，与导出倍率无关 |
| CSS 换算 | 设计稿数值（pt）= CSS 值（px），无需换算 |

**全局设计基准说明：**

| 概念 | 说明 |
|------|------|
| 设计稿单位 | **375pt**（逻辑点），对应 CSS px，直接用于布局尺寸 |
| 图片导出倍率 | 所有图片统一 **@3x 导出**，规则简单，全机型清晰 |
| 坐标系 | 房间内元素坐标使用 **0–1 小数比例**，相对于容器宽/高，与导出倍率无关 |
| CSS 换算 | 设计稿数值（pt）= CSS 值（px），无需换算 |

### 4.0 视觉元素完整分类

所有页面上的视觉元素按来源分为三类：

#### 一、图片素材（Nanobanana Pro 生图 → 上传替换）

| 元素 | 格式 | 导出 | 说明 |
|------|------|------|------|
| 过场 PPT 图 | JPG | @3x | 每章 3–6 张，全屏剧情画面 |
| 房间背景图 | JPG | @3x | 空房间无家具，固定背景 |
| 房间缩略图 | JPG | @3x | 首页卡片展示用 |
| 家具完整图 `full.png` | PNG 透明背景 | @3x | 房间摆放 + 合成揭示共用 |
| 家具拼图碎片 `piece_0~3.png` | PNG 透明背景 | @3x | 结算页碎片栏 |
| 猫咪 `idle.png` 等 | PNG 透明背景 | @3x | 房间内角色，按状态分文件 |

#### 二、CSS 绘制（代码生成，Paper 调参数）

| 元素 | 说明 |
|------|------|
| 矩形按钮 | 圆角、描边、阴影、文字颜色全用 CSS token 控制 |
| 文字排版 | 标题、正文、说明、标签 |
| 进度条、分割线 | CSS 绘制 |
| 卡片容器、背景色块 | CSS 绘制 |
| 圆形图标按钮的底色圆 | CSS `border-radius: 50%`，颜色和大小用 token |

#### 三、SVG（自行设计 → 上传为 .svg 文件）

| 元素 | 实现方式 | 说明 |
|------|----------|------|
| 圆形图标按钮的内部图形 | `<img src="icon.svg">` 嵌入底色圆内 | 只设计图形，底色圆由 CSS 控制 |
| 首页右下角悬浮开始按钮 | `<img src="btn-quick-start.png">` 整体渲染 | PNG 素材，1:1 比例，透明背景，尺寸在 Paper 里确定 |

---

**圆形图标按钮的分层结构：**

```
圆形按钮
  └── CSS：border-radius:50%，背景色，阴影，尺寸   ← Paper 调这里
      └── <img src="/assets/ui/icons/xxx.svg">     ← 替换 SVG 文件
```

好处：改按钮颜色只动 CSS，不需要重导出 SVG；换图标只换 SVG 文件，不动 CSS。

**异形快速开始按钮的交互方案：**

SVG 只负责视觉形状，按压反馈由 CSS 实现，设计 SVG 时无需考虑交互状态：

```css
/* styles/tokens.css */
/* ↓ 设计师常调：按压缩放幅度 */
--btn-press-scale: 0.95;

/* Button.css */
.btn-quick-start:active {
  transform: scale(var(--btn-press-scale));
  transition: transform 80ms ease;
}
```

---

**SVG 文件规范：**

| 项目 | 规格 |
|------|------|
| 画板尺寸 | 按视觉大小设计，建议图标类用正方形画板（如 48×48pt） |
| 格式要求 | 纯矢量，不含栅格图像，不含字体 |
| 颜色 | 图形颜色画在 SVG 内；若需要跟随主题色变化，可用 `currentColor`，由父元素 CSS 控制 |
| 路径 | 所有文字转曲（outline），避免字体缺失 |
| 文件路径 | `/assets/ui/icons/{name}.svg`，异形按钮放 `/assets/ui/buttons/{name}.svg` |

### 4.1 资产目录结构

```
public/
└── assets/
    ├── home/
    │   └── bg_bottom.png           # 首页底部固定场景图（房子+草地，透明背景）
    ├── audio/
    │   └── sfx-click.mp3           # 全局点击音效（时长 < 200ms）
    ├── words/
    │   ├── cat.png                 # 单词配图（正方形PNG @3x，答题页圆形展示）
    │   ├── sofa.png
    │   └── ...（每个单词对应一张，命名与单词一致）
    ├── rooms/
    │   ├── ch1/
    │   │   ├── bg.jpg              # 房间图（首页卡片 + 详情页通顶共用）
    │   │   ├── frame.png           # 房间边框 PNG（透明背景，首页卡片叠加用）
    │   │   └── furniture/
    │   │       └── lv1/            # 每件家具一个子目录
    │   │           ├── piece_0.png # 拼图碎片 0（透明背景，带拼图轮廓）
    │   │           ├── piece_1.png # 拼图碎片 1
    │   │           ├── piece_2.png # 拼图碎片 2
    │   │           ├── piece_3.png # 拼图碎片 3
    │   │           └── full.png    # 完整家具图（合成揭示 + 房间摆放用）
    │   ├── ch2/
    │   │   └── ...（同上）
    │   └── ch3–ch5/
    ├── story/
    │   ├── ch1/
    │   │   ├── slide_01.jpg        # 剧情图片（按顺序编号）
    │   │   ├── slide_02.jpg
    │   │   ├── slide_03.jpg
    │   │   └── bgm.mp3             # 章节配乐
    │   └── ch2–ch5/
    ├── onboarding/
    │   ├── intro/
    │   │   └── cat_walk.png            # 初始动画猫咪图（1:1 PNG @3x，占位图先用）
    │   ├── story/
    │   │   ├── slide_01.jpg
    │   │   ├── slide_02.jpg
    │   │   ├── slide_03.jpg
    │   │   └── bgm.mp3
    │   └── cat/
    │       ├── appearance_1.png        # 外观1 预览图（自定义页用，占位图先用）
    │       ├── appearance_2.png        # 外观2 预览图
    │       ├── appearance_3.png        # 外观3 预览图
    │       └── appearance_4.png        # 外观4 预览图
    ├── cat/
    │   # 命名规则：appearance_{外观}_{personality}_{gender}.png
    │   # 外观：1=橘猫 2=白猫 3=黑猫 4=折耳猫
    │   # 性格：homebody=居家 lively=活泼 mysterious=神秘
    │   # 性别：m=男孩猫 f=女孩猫
    │   # 共 4×3×2 = 24 张，占位图先用
    │   ├── appearance_1_homebody_m.png
    │   ├── appearance_1_homebody_f.png
    │   ├── appearance_1_lively_m.png
    │   ├── appearance_1_lively_f.png
    │   ├── appearance_1_mysterious_m.png
    │   ├── appearance_1_mysterious_f.png
    │   ├── appearance_2_homebody_m.png
    │   ├── appearance_2_homebody_f.png
    │   ├── appearance_2_lively_m.png
    │   ├── appearance_2_lively_f.png
    │   ├── appearance_2_mysterious_m.png
    │   ├── appearance_2_mysterious_f.png
    │   ├── appearance_3_homebody_m.png
    │   ├── appearance_3_homebody_f.png
    │   ├── appearance_3_lively_m.png
    │   ├── appearance_3_lively_f.png
    │   ├── appearance_3_mysterious_m.png
    │   ├── appearance_3_mysterious_f.png
    │   ├── appearance_4_homebody_m.png
    │   ├── appearance_4_homebody_f.png
    │   ├── appearance_4_lively_m.png
    │   ├── appearance_4_lively_f.png
    │   ├── appearance_4_mysterious_m.png
    │   └── appearance_4_mysterious_f.png
    └── ui/
        ├── icons/                  # 圆形图标按钮的内部图形 SVG
        │   ├── icon-furniture.svg
        │   ├── icon-gallery.svg
        │   ├── icon-practice.svg
        │   └── icon-profile.svg
        ├── home-icon.png           # 顶部导航栏房子图标（透明背景PNG @3x）
        └── buttons/                # 异形按钮素材
            └── btn-quick-start.png # 右下角悬浮开始按钮（透明背景PNG @3x，1:1比例）
```

### 4.2 各类图片规格

#### 首页底部场景图

| 项目 | 规格 |
|------|------|
| 文件名 | `bg_bottom.png` |
| 设计尺寸 | **375 × 350 pt** |
| 导出尺寸 | **1125 × 1050 px**（@3x 导出） |
| 背景 | **透明背景**（必须），顶部边缘设计时需考虑与渐变色的软衔接 |
| 内容 | 房子 + 草地 + 装饰元素，所有章节共用，固定在首页底部 |
| 格式 | PNG @3x |
| 生图注意 | 图片底部区域可留出适当空白，避免常驻悬浮按钮长期遮挡主视觉内容 |

#### 房间图

同一张图用于两处，按详情页全宽尺寸生图，首页卡片通过 CSS 裁切展示，两处都清晰无模糊：

| 项目 | 规格 |
|------|------|
| 文件名 | `bg.jpg` |
| 设计尺寸 | **375 × 202 pt**（保持 311:169 宽高比，宽度撑满全屏） |
| 导出尺寸 | **1125 × 607 px**（@3x 导出） |
| 内容 | 空房间背景，无任何家具；光影、地板、墙面、窗户等固定元素 |
| 格式 | JPG，质量 85%+ |

**两处使用方式：**

| 使用场景 | 展示方式 | 边框 | 家具/猫咪 |
|----------|----------|------|-----------|
| 首页卡片 | CSS 裁切至 311×169pt，居中于页面 | 叠加 `frame.png`，底部对齐 | 复用 `RoomScene` 组件实时渲染 |
| 房间详情页顶部 | 全宽展示 375×202pt，无裁切 | 无边框 | 复用 `RoomScene` 组件实时渲染 |

首页卡片裁切 CSS：

```css
.room-card-bg {
  width: 311px;
  aspect-ratio: 311 / 169;
  object-fit: cover;        /* 图片居中裁切，不拉伸 */
  object-position: center;
}
```

#### 家具图片（拼图碎片 + 完整图）

每件家具需要生成 **5 张图**，放在同一子目录下：

| 文件名 | 内容 | 规格 |
|--------|------|------|
| `piece_0.png` | 拼图碎片 0（4片之一） | 透明背景，带拼图凸起/凹入轮廓，格缝设计画入图内 |
| `piece_1.png` | 拼图碎片 1 | 同上 |
| `piece_2.png` | 拼图碎片 2 | 同上 |
| `piece_3.png` | 拼图碎片 3 | 同上 |
| `full.png` | 完整家具图 | 合成揭示动画 + 房间摆放共用，透明背景 |

**通用规格：**

| 项目 | 规格 |
|------|------|
| 设计尺寸 | 按实际视觉大小设计，无需统一画布 |
| 导出尺寸 | **@3x 导出**（保证高密度屏清晰，最长边通常 300–600px） |
| 背景 | **透明背景**（必须，PNG-24 带 Alpha 通道） |
| 风格 | `full.png` 与房间背景图透视角度一致，阴影画入图内 |
| 碎片设计 | 4 片为同一家具按拼图形状切割，拼合后还原为 `full.png` 的完整轮廓 |
| 位置数据 | `full.png` 在房间中的坐标（0–1 小数比例）由设计师填入 `roomConfig` |

**文件路径规范：**
```
/assets/rooms/ch{chapterId}/furniture/lv{levelId}/piece_{0-3}.png
/assets/rooms/ch{chapterId}/furniture/lv{levelId}/full.png
```

#### 剧情图片

| 项目 | 规格 |
|------|------|
| 文件名 | `slide_01.jpg`、`slide_02.jpg`...（按顺序） |
| 设计尺寸 | **375 × 667 pt**（全屏竖屏，基于 375pt 设计稿） |
| 导出尺寸 | **1125 × 2001 px**（@3x 导出） |
| 内容 | 每张图对应一个剧情画面，可含文字气泡（画入图内）或留空由代码叠加字幕 |
| 格式 | JPG，质量 90% |
| 数量 | 每章节 3–6 张，在 `storyConfig` 中定义 |

#### 章节配乐

| 项目 | 规格 |
|------|------|
| 文件名 | `bgm.mp3` |
| 时长 | 建议 60–120 秒，循环点平滑 |
| 格式 | MP3，128kbps+ |

#### 房间边框图

| 项目 | 规格 |
|------|------|
| 文件名 | `frame.png` |
| 设计尺寸 | **311 × 187 pt**（后续可能微调） |
| 导出尺寸 | **933 × 561 px**（@3x 导出） |
| 背景 | **透明背景**（必须），只有边框装饰区域有像素 |
| 内容 | 房间外框装饰，顶部高出房间图 **18pt**（187 - 169 = 18），用于放置章节名称 |
| 对齐 | 与房间图**底部对齐**，整体居中于页面 |
| 说明 | 所有章节共用同一套边框；也可按章节设计不同风格，命名为 `frame_ch{n}.png` |

#### 答题页背景色

答题页背景分两层，全部 CSS 实现，无图片资产：

**第一层：章节纯色背景**
每章节一个纯色，由设计师在 `roomConfig` 中定义 `gameBg.color`。

**第二层：底部白色渐变叠加层（固定，全章节统一）**
从屏幕底部向上渐变，覆盖底部 40% 区域，白色透明度从 100% → 0%。这一层保证底部交互区（答题选项、按钮、完成提示等）背景始终干净清晰，视觉一致。

```
屏幕布局（示意）：
┌──────────────────┐
│                  │  ← 纯色背景（章节色）
│   题目内容区      │
│                  │
│ ░░░░░░░░░░░░░░░  │  ← 白色渐变开始（透明度 0%）
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│ ████████████████ │  ← 白色渐变结束（透明度 100%）距底部 40%
│  底部交互区       │  ← 纯白背景，视觉最清晰
│ [你真棒！完成提示] │
└──────────────────┘
```

在 `roomConfig` 中只需定义纯色：

```typescript
// ↓ 设计师常调：答题页章节背景色
gameBg: {
  color: '#F5E6C8',   // 章节纯色背景
},
```

白色渐变层固定写在全局样式里，不需要每章节单独配置：

```css
/* styles/game.css */

.game-page {
  position: relative;
  width: 100%;
  height: 100%;
  /* 纯色背景，颜色由 JS 从 roomConfig 注入 CSS 变量 */
  background: var(--game-bg-color);
}

/* 底部白色渐变叠加层（固定，全章节统一） */
/* ↓ 设计师常调：渐变起始位置（从底部向上覆盖的比例） */
.game-page::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 40%;
  background: linear-gradient(
    to top,
    rgba(255, 255, 255, 1)   0%,
    rgba(255, 255, 255, 0) 100%
  );
  pointer-events: none;
  z-index: 1;
}

/* 底部交互区浮在渐变层上方 */
.game-bottom-area {
  position: relative;
  z-index: 2;
}
```

各章节纯色参考（具体色值由设计确定）：

| 章节 | 主题 | 背景色参考 |
|------|------|------------|
| 1 | 街角流浪 | 暖米灰 |
| 2 | 温暖新家 | 奶黄 |
| 3 | 幼儿园 | 浅天蓝 |
| 4 | 公园探险 | 淡草绿 |
| 5 | 厨房美食 | 奶白 |

#### 全局加载过渡动画（`LoadingTransition`）

所有需要等待的场景统一复用此组件，保持全局体验一致。

**动画内容：**
- 全屏背景色（由调用方传入，不同场景有不同颜色）
- 品牌 Logo 居中
- Logo 下方 `Learn` / `play` / `purr` 三词依次淡入淡出循环，作为等待提示
- 数据就绪后整页淡出，进入目标页面

**时长控制：**
- 最短展示 800ms（避免闪烁）
- 最长等待 5s，超时显示错误提示

**各场景触发方式：**

| 触发场景 | 背景色 | 备注 |
|----------|--------|------|
| 进入答题页 | 章节 `gameBg.color` | 与答题页背景色衔接 |
| 应用启动跳转 | `#FFB840` 品牌主色 | 启动画面结束后 |
| 章节过场加载 | `#0D0A07` 深色 | 与过场全屏风格衔接 |
| 其他页面跳转 | `#FFF8E7` 通用暖白 | 通用兜底 |

```typescript
// 全局复用，调用方只需传入背景色
interface LoadingTransitionProps {
  bgColor?: string;        // 默认 '#FFF8E7'
  minDuration?: number;    // 最短展示时长，默认 800ms
  onReady: () => void;     // 数据就绪时调用，组件自动淡出
}

// 使用示例
<LoadingTransition
  bgColor={roomConfig.gameBg.color}
  onReady={() => setPageReady(true)}
/>
```

#### 猫咪形象图

| 项目 | 规格 |
|------|------|
| 命名规则 | `appearance_{n}_{personality}_{gender}.png`，n=1–4，personality=homebody/lively/mysterious，gender=m/f |
| 数量 | **24 张**（4 种外观 × 3 种性格 × 2 种性别） |
| 导出尺寸 | @3x，透明背景 PNG，1:1 正方形画布 |
| 风格 | 与房间背景图风格一致，手绘插画感 |
| 占位 | 开发阶段自动生成占位图，后续逐一替换 |

自定义页预览图（4张）：`/assets/onboarding/cat/appearance_{n}.png`
房间内使用图（24张）：`/assets/cat/appearance_{n}_{personality}_{gender}.png`

#### 初始动画猫咪图

| 项目 | 规格 |
|------|------|
| 文件名 | `/assets/onboarding/intro/cat_walk.png` |
| 尺寸 | **1:1 正方形**，建议 300×300pt，@3x 导出 |
| 格式 | PNG，透明背景 |
| 占位 | 开发阶段自动生成占位图，后续替换 |

#### 待定资产占位清单

以下资产路径已预建，开发阶段自动生成占位内容，后续替换：

| 资产 | 路径 | 格式 | 占位方式 |
|------|------|------|----------|
| 首页 BGM | `/assets/audio/bgm-home.mp3` | MP3 | 空音频文件 |
| 答题页 BGM | `/assets/audio/bgm-game.mp3` | MP3 | 空音频文件 |
| 品牌 Logo | `/assets/ui/logo.png` | PNG | 占位色块 |
| 房子图标 | `/assets/ui/home-icon.png` | PNG | 占位色块 |
| 悬浮开始按钮 | `/assets/ui/buttons/btn-quick-start.png` | PNG | 占位色块 |
| 底部导航图标（4个） | `/assets/ui/icons/icon-{name}.svg` | SVG | 自动生成简单几何占位图形，按钮先只显示文字 |
| 设置按钮图标 | `/assets/ui/icons/icon-settings.svg` | SVG | 自动生成占位图形 |

### 4.3 占位符策略

AI 编程工具生成代码时，所有图片使用占位色块 + 文字标注，便于 Paper 中预览布局：

```tsx
// 占位符组件示例（AI 编程工具生成，设计师替换图片后自动生效）
function RoomBackground({ chapterId }: { chapterId: number }) {
  return (
    <div className="room-bg-wrapper">
      <img
        src={`/assets/rooms/ch${chapterId}/bg.jpg`}
        alt={`Chapter ${chapterId} room`}
        onError={(e) => {
          // 图片未上传时显示占位色块
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.removeAttribute('hidden');
        }}
      />
      <div hidden className="room-placeholder">
        {`房间背景 ch${chapterId}\n750×1200px`}
      </div>
    </div>
  );
}
```

---

## 5. 站点地图 & 页面清单

### 页面列表

| 页面 | 路由 | 说明 |
|------|------|------|
| 故事地图首页 | `/` | 卡片式房间列表 + 底部功能栏 |
| 启动画面 | `/splash` | 品牌 Logo + 背景音乐，首次 / 每次打开 |
| 初始动画 | `/intro` | 猫咪从黑暗走出的剧情动画，仅首次 |
| 英语水平选择 | `/onboarding/level` | 4个场景化级别选择，仅首次，可在个人主页调整 |
| 自定义猫咪 | `/onboarding` | 选外观 + 性别 + 性格标签 + 起名，仅首次 |
| 引导过场 | `/onboarding/story` | 猫咪被路人捡回家的第一段剧情，仅首次 |
| 故事地图首页 | `/` | 卡片式房间列表 + 底部功能栏 |
| 房间详情 | `/rooms/:chapterId` | 房间全景 + 拼图碎片进度 + 故事线 + 【开始】按钮 |
| 单词游戏 | `/chapter/:chapterId/level/:levelId` | 10 道混合题型 |
| 关卡结算页 | `/chapter/:chapterId/level/:levelId/result` | 拼图碎片揭示 + 合成动画 + 答题统计 |
| 故事过场 | `/chapter/:chapterId/story` | PPT 多图 + 配乐 |
| 我的房间 | `/room` | 所有已解锁房间画廊 |
| 个人主页 | `/profile` | 我的猫咪资料 + 学习统计 + 成就徽章 + 设置 |
| 图鉴弹窗 | `?modal=rooms` | 3 列网格 |
| 练习模块 | `?modal=practice` | 错题本 + 专项练习 |

### 路由策略

```
HashRouter（#/rooms/1）
→ Paper 静态部署兼容，避免刷新 404

弹窗用 Query 参数（?modal=rooms）
→ 浏览器前进/后退行为正确
→ 关闭弹窗 = navigate('/') 回首页
```

### 完整用户流程

```
【首次启动】
  ↓
启动画面 /splash（1.5s）
  ↓
初始动画 /intro
  └── 猫咪从黑暗走出，停在屏幕中央
      文字旁白淡入，可点击跳过
  ↓
英语水平选择 /onboarding/level
  └── 4 个场景化级别卡片，单选
      → 决定起始章节和题目难度
  ↓
自定义猫咪 /onboarding
  └── 选预设外观（4种）→ 调颜色 → 选性格标签 → 给猫咪起名
      → 点击「就这样！开始冒险 →」
  ↓
引导过场 /onboarding/story
  └── 猫咪被路人捡回家的第一段剧情（PPT 多图 + 配乐）
      → 直接衔接进入首页 /
  ↓
首页 /（猫咪数据存本地，无需注册）

【常规使用】
首页 /
  │
  ├── 点击房间卡片
  │     ↓
  │   房间详情 /rooms/:chapterId
  │     └── 点击底部【开始】
  │           ↓
  │         单词游戏 /chapter/:cId/level/:lId
  │           └── 完成全部题目
  │                 ↓
  │               关卡结算页 /result
  │                 ① 解锁本关拼图碎片（从左到右依次点亮）
  │                 ② 前3关：显示「还差 X 片即可合成」
  │                 │    └── 点击「继续下一关 →」
  │                 │          → 直接跳入下一关答题页（无需返回房间）
  │                 ③ 第4关：「立即合成」→ 碎片飞入 → 家具揭示
  │                 ④ 答题统计（正确率 / 本轮单词 / 对错明细）
  │                 └── 第4关合成后点「返回房间 →」
  │                       → 房间详情页，完整家具飘落出现在预设坐标
  │
  ├── 章节第4关完成后（家具合成完成）
  │     ↓
  │   故事过场 /chapter/:chapterId/story
  │     PPT 多图 + 配乐，可跳过 → 返回首页 /
  │
  └── 底部功能栏
        ├── 图鉴 → ?modal=rooms
        ├── 练习 → ?modal=practice（后续迭代）
        └── 我的 → /profile（我的猫咪 + 学习统计 + 注册入口）
```

---

## 6. 新手引导与猫咪自定义

### 6.1 启动画面（`/splash`）

- 每次打开应用时显示，持续 1.5s
- 内容：品牌 Logo 居中 + 背景配乐淡入
- 判断逻辑：
  - **首次启动**（`gameState` 不存在）→ 跳转 `/intro`
  - **非首次启动** → 直接跳转 `/`（首页），无任何进度提醒
- 未完成的关卡不做任何提示，用户进入该关卡时从头重新开始答题

### 6.2 初始动画（`/intro`）仅首次

- 全屏黑色背景，猫咪小图从屏幕底部缓缓走入，停在中央
- 旁白文字依次淡入：
  ```
  「有一只小猫……」
  「它在等待，一个属于自己的家。」
  「而那个家，需要你来建造。」
  ```
- 右上角「跳过」按钮，点击直接跳至 `/onboarding/level`
- 动画播完后自动跳转 `/onboarding/level`

### 6.3 英语水平选择（`/onboarding/level`）仅首次

在自定义猫咪之前，先选择英语水平，决定起始章节和题目难度。

#### 页面结构

```
顶部提示
  └── 「你的英语大概在哪个阶段？」
      「选对了，学起来才刚刚好 🐾」

四个水平卡片（纵向排列，单选）：

  🐾 纯新手
  「英文歌听不懂词，点餐靠手指」

  🐾 略知一二
  「能认出常见单词，开口还是怕」

  🐾 勉强应付
  「旅游基本够用，看电影靠字幕」

  🐾 还不错哦
  「日常沟通没问题，想再提升」

底部按钮
  └── 「就这样！」（选中任一项后激活）→ 跳转 /onboarding
```

#### 各级别对应规则

所有用户均从**第 1 章**开始，级别只影响题目难度，不跳过任何章节：

| 级别 | 词汇范围 | 词长 | 题型策略 |
|------|----------|------|----------|
| 🐾 纯新手 | 超基础名词 | 3–4 字母 | 字母连连看、图片配对为主，拼写题少出 |
| 🐾 略知一二 | 基础词汇 | 3–5 字母 | 五种题型均匀出现 |
| 🐾 勉强应付 | 中等词汇 | 4–6 字母 | 填空和填字比例增加 |
| 🐾 还不错哦 | 较难词汇 | 5–7 字母 | 以填空、填字为主，图片配对减少 |

#### 级别调整

用户可在个人主页「设置」中随时重新选择英语水平，调整后 `gameState.difficulty` 字段更新，题型难度从下一关起即时生效，已完成的进度不受影响。

### 6.4 自定义猫咪（`/onboarding`）仅首次

#### 页面结构

```
顶部提示
  └── 「来，先认识一下你的猫咪 🐱」

猫咪实时预览区（页面上半部分）
  └── 根据选择实时切换形象图片

外观选择（预设多种形象，横向滑动选择）
  └── 每种形象是完整插画，颜色画在图内
      示例：橘猫 / 白猫 / 黑猫 / 奶牛猫 / 折耳猫 / 布偶猫
      具体数量和形象后续由设计确定

性别（单选）
  └── ♂ 男孩猫 / ♀ 女孩猫
      影响对话文案的语气和用词

性格标签（单选）
  └── 居家 🏠 / 活泼 ⚡ / 神秘 🌙

猫咪起名
  └── 文字输入框，placeholder：「给你的猫咪起个名字」
      最多 10 个字符

底部按钮
  └── 「Let's purr! 🐾」（填写名字后激活）
```

#### 性别 × 性格 对话文案风格

性别和性格共同影响对话语气，组合后有 6 种文案风格：

| 性别 | 性格 | 文案风格 | 示例 |
|------|------|----------|------|
| ♂ | 居家 | 温柔宅系 | 「在家就很好……」 |
| ♂ | 活泼 | 爽朗开朗 | 「哇！好好玩！」 |
| ♂ | 神秘 | 冷静深沉 | 「这里……有种奇怪的感觉。」 |
| ♀ | 居家 | 温柔恬静 | 「窝在这里真舒服呢～」 |
| ♀ | 活泼 | 元气可爱 | 「哇哇哇！超喜欢这个！」 |
| ♀ | 神秘 | 神秘感性 | 「总觉得这里藏着什么秘密……」 |

> 文案由 `cat.gender` + `cat.personality` 两个字段共同索引，对应 `src/data/catDialogue.ts` 中的文案配置。

#### 技术实现

```typescript
// 猫咪自定义数据，存入 gameState.cat
interface CatProfile {
  name: string;                         // 用户起的名字，最多 10 字符
  appearance: 1 | 2 | 3 | 4;          // 外观编号：1=橘猫 2=白猫 3=黑猫 4=折耳猫
  gender: 'male' | 'female';           // 性别：影响对话文案 + 外观图片
  personality: 'homebody' | 'lively' | 'mysterious'; // 3种性格
}
// 房间内图片路径：/assets/cat/appearance_{appearance}_{personality}_{m|f}.png
// 共 24 张（4外观 × 3性格 × 2性别）
```

外观直接切换图片，无需 `hue-rotate`：

```tsx
{/* 🖼️ ASSET | 猫咪形象 | 透明背景PNG @3x | /assets/onboarding/cat/appearance_{n}.png */}
<img
  src={`/assets/onboarding/cat/appearance_${cat.appearance}.png`}
  className="cat-preview"
  alt={cat.name}
/>
```

### 6.5 引导过场（`/onboarding/story`）仅首次

- 自定义完成后直接触发，无需额外点击
- 内容：猫咪（使用用户刚定义的形象）被路人捡到、带回第一个房间的剧情
- 形式：PPT 多图 + 配乐，与章节故事过场相同格式，复用 `StoryPlayer` 组件
- 图片数量：3–4 张，在 `/assets/onboarding/` 目录下
- 结束后直接进入首页 `/`，不经过任何跳转确认

`StoryPlayer` 组件通过 `onComplete` 回调决定结束后的行为，不在组件内写死跳转：

```typescript
interface StoryPlayerProps {
  config: StoryConfig;
  onComplete: () => void;  // 调用方决定结束后的行为
}

// 引导过场：结束后进首页
<StoryPlayer config={onboardingStory} onComplete={() => navigate('/')} />

// 章节过场：结束后触发章节解锁逻辑再进首页
<StoryPlayer config={chapterStory} onComplete={() => {
  unlockNextChapter();
  navigate('/');
}} />
```

### 6.6 个人主页 — 我的猫咪（`/profile`）

在原有学习统计基础上，顶部新增「我的猫咪」卡片：

```
我的猫咪卡片
  ├── 猫咪大图（当前形象）
  ├── 猫咪名字  性别标签  性格标签
  ├── 陪伴天数：xx 天
  └── 「修改形象」入口 → 重新进入 /onboarding（已有数据预填充）
```

注册入口也在此页：

```
学习统计（我的猫咪卡片下方）
  ├── 已学单词数量：xx 个
  └── 错题率：xx%（答错题数 / 总答题数）

其他统计项后续迭代补充
```

进度云同步提示（非注册用户显示）：

```
进度云同步提示（非注册用户显示）
  └── 「注册账号后，换设备也能继续你的故事 →」
      点击 → 注册/登录页（后续实现，范围外）
```

---

## 7. 功能详述

### 7.1 故事地图首页（`/`）

#### 页面背景结构

两层，逻辑简单：

```
层1（固定，不滚动）：渐变色背景，position: fixed，铺满全屏，始终在最底层
层2（随列表滚动）：房间卡片列表 + 底部场景图，底部图是列表最后一个元素
```

**滚动行为：** 渐变色始终固定。列表向上滚动时，底部场景图跟随列表一起上移，最终消失在屏幕外，效果与参考图一致。

**CSS 实现：**

```css
/* styles/home.css */

/* 层1：渐变色背景，固定，最底层 */
.home-bg-gradient {
  position: fixed;
  inset: 0;
  z-index: 0;
  /* ↓ 设计师常调：首页天空渐变色 */
  background: linear-gradient(180deg, #87CEEB 0%, #C8E8F5 60%, #D4EEC0 100%);
}

/* 层2：可滚动内容区 */
.home-content {
  position: relative;
  z-index: 10;
  padding-top: var(--safe-top);
  display: flex;
  flex-direction: column;   /* 房间从上到下排列，最新章节在顶部 */
}

/* 底部场景图：列表最后一个元素，随列表滚动 */
.home-bg-bottom {
  width: 100%;
  /* ↓ 设计师常调：底部场景图显示高度 */
  height: 350px;
  object-fit: cover;
  object-position: bottom center;
  display: block;
  flex-shrink: 0;
}
```

**渲染结构：**

```tsx
{/* 层1：渐变色背景，固定 */}
<div className="home-bg-gradient" />

{/* 层2：可滚动列表 */}
<div className="home-content">
  {/* 房间卡片，从最新到最早 */}
  {rooms.map(room => <RoomCard key={room.chapterId} {...room} />)}

  {/* 🖼️ ASSET | 首页底部场景图 | 透明背景PNG @3x | /assets/home/bg_bottom.png */}
  {/* 列表最后一个元素，随列表滚动，滑上去后消失在屏幕外 */}
  <img src="/assets/home/bg_bottom.png" className="home-bg-bottom" alt="" />
</div>
```

#### 顶部导航栏

固定在屏幕顶部（`position: sticky, top: 0`），滚动时始终可见。

```
左侧：房子图标（PNG）+ 当前已解锁房间数量
右侧：设置按钮
```

- 房子图标用 PNG 上传，路径 `/assets/ui/icons/icon-home.png`
- 点击设置按钮 → 居中弹窗，内容：
  - **游戏音乐开关**（toggle）— 默认**开启**，控制全局 BGM 播放
  - **游戏音效开关**（toggle）— 默认**开启**，控制点击交互时触发的点击音效
  - 制作人名称
  - 当前版本号
- 两项开关状态持久化存储在 `gameState.settings` 中，下次打开应用时恢复上次设置
- 导航栏无资源数量、无头像入口
- 背景轻微模糊（`backdrop-filter: blur`）

#### 房间卡片结构

每张卡片由以下元素叠加构成：

```
层级（从下到上）：
  层1：房间图 bg.jpg（横版裁切比例，RoomScene 渲染含家具和猫咪）
  层2：房间边框 frame.png（底部与 bg.jpg 对齐，顶部高出 bg.jpg，高出部分居中显示章节名称）
  层3：左下角进度标签 / 右下角状态标签
```

**边框与背景图的对齐方式：**
- `frame.png` 与 `bg.jpg` **底部对齐**，整体居中于页面
- `frame.png` 顶部高出 `bg.jpg` **18pt**（187 - 169 = 18），用于放置章节名称
- 章节名称文字居中摆放在高出的区域内

```css
/* room card 布局 */
.room-card {
  position: relative;
  /* 卡片总高度 = 房间图高度 + frame 高出部分 18pt */
  padding-top: 18px;
  /* ↓ 设计师常调：卡片固定宽度，居中于页面（后续可能微调） */
  width: 311px;
  margin: 0 auto;
}
.room-card-bg {
  width: 311px;
  /* ↓ 设计师常调：房间图宽高比 311:169 */
  aspect-ratio: 311 / 169;
  object-fit: cover;
}
.room-card-frame {
  position: absolute;
  bottom: 0;     /* 底部与房间图对齐 */
  left: 0;
  width: 311px;
  /* frame.png 高度 187pt，顶部自然高出 18pt */
}
.room-card-title {
  position: absolute;
  top: 0;
  height: 18px;  /* ↓ 设计师常调：章节名称区域高度，与 frame 高出部分一致 */
  left: 0; right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**卡片信息标签：**

| 位置 | 内容 | 状态说明 |
|------|------|----------|
| 左下角 | 关卡进度 `x/4` | 仅进行中章节显示；已完成显示 ✓；未解锁不显示 |
| 右下角 | 房间状态 | 进行中：无标签（正常显示）；已完成：`已完成`；未解锁：`🔒` |

**卡片点击：** 整体可点击，进入房间详情页

**未解锁卡片视觉：** 灰色蒙版叠加在层1上方，frame 和标签正常显示

#### 房间卡片列表

- 最新章节在最顶部，向下排列
- 相邻卡片间距在 Paper 里微调

#### 右下角悬浮按钮

- 使用 PNG 素材，1:1 比例，具体尺寸在 Paper 里确定
- 固定悬浮在屏幕右下角，`position: fixed`
- **始终显示，不随关卡状态变化隐藏**
- 点击行为：进入当前进行中章节的当前关卡；若全部通关则进入复习模式（后续定义）

```
🖼️ ASSET | 右下角悬浮开始按钮 | 透明背景PNG @3x | /assets/ui/buttons/btn-quick-start.png
```

---

### 7.2 单词游戏

> **v1.2 变更：** 移除进入关卡前的家具预览（原 shimmerSweep 动画），保留悬念至答题完成后揭示。

#### 页面层级结构

答题页采用「背景色 + 浮动白色卡片 + 顶部单词插图」的层级布局：

```
┌─────────────────────────────────┐  ← Safe Area Top
│  ← 返回    第x关 · WordPet      │  ← 顶部导航栏（透明背景）
├─────────────────────────────────┤
│                                 │
│         章节背景纯色             │  ← 层1：gameBg.color 铺满全屏
│                                 │
│       [ 单词插图 PNG ]           │  ← 层3：单词配图，白色描边PNG
│       （图片下半部分             │       保持原始形状，不裁圆形
│        与卡片重叠）              │       较大尺寸，充分传达语义
│  ┌──────────────────────────┐   │  ← 卡片上沿 = 图片垂直中线
│  │  第 x 题  |  共 10 题    │   │  ← 层2：白色圆角卡片
│  │                          │   │
│  │  题目内容文案              │   │
│  │                          │   │
│  │  ┌────────────────────┐  │   │
│  │  │      选项 A        │  │   │
│  │  ├────────────────────┤  │   │
│  │  │      选项 B        │  │   │
│  │  ├────────────────────┤  │   │
│  │  │      选项 C        │  │   │
│  │  ├────────────────────┤  │   │
│  │  │      选项 D        │  │   │
│  │  └────────────────────┘  │   │
│  └──────────────────────────┘   │
│                                 │
│         留白区域                 │  ← 底部反馈弹窗弹出区
│                                 │
└─────────────────────────────────┘
```

**各层级规范：**

| 层级 | 元素 | 规范 |
|------|------|------|
| 层1 | 全屏背景色 | `gameBg.color` 章节纯色，铺满全屏 |
| 层1 | 底部白色渐变 | 固定叠加，覆盖底部 40% |
| 层2 | 白色题目卡片 | 白色背景，`border-radius: var(--radius-lg)`，左右边距 `var(--page-padding-x)`，`box-shadow: 0 8px 24px rgba(0,0,0,0.08)` |
| 层3 | 单词插图 | 白色描边 PNG，保持原始形状，**不裁圆形**，居中显示，`z-index` 高于卡片 |

**单词插图与卡片的位置关系：**

图片高度的一半在卡片上方（背景色区域），一半压入卡片内部，卡片顶部 padding 为图片高度的一半，确保图片始终紧贴卡片顶部：

```css
/* ↓ 设计师常调：单词插图尺寸 */
--word-image-size: 160px;

.game-word-image {
  width: var(--word-image-size);
  height: auto;
  max-height: var(--word-image-size);
  object-fit: contain;
  display: block;
  margin: 0 auto;
  position: relative;
  z-index: 2;
  margin-bottom: calc(var(--word-image-size) / -2);
  /* 白色描边画在图片内（PNG 导出时已包含），无需 CSS 额外处理 */
}

.game-card {
  position: relative;
  z-index: 1;
  background: #fff;
  border-radius: var(--radius-lg);
  margin: 0 var(--page-padding-x);
  /* ↓ 设计师常调：顶部 padding = 图片高度的一半，为压入的图片留出空间 */
  padding-top: calc(var(--word-image-size) / 2);
  padding-bottom: 20px;
  padding-left: 16px;
  padding-right: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.game-progress {
  text-align: center;
  /* ↓ 设计师常调：进度与题目间距 */
  margin-bottom: 6px;
}

.game-question {
  text-align: center;
  /* ↓ 设计师常调：题目与选项间距 */
  margin-bottom: 20px;
}

.game-options {
  display: flex;
  flex-direction: column;
  /* ↓ 设计师常调：选项间距，见 tokens.css --game-option-gap */
  gap: var(--game-option-gap);
}

.game-option {
  /* ↓ 设计师常调：选项默认背景色 */
  background: var(--color-bg);
  border-radius: var(--radius-md);
  /* ↓ 设计师常调：选项内边距 */
  padding: 14px 16px;
  text-align: center;
}
```

**单词配图资产规范：**

```
🖼️ ASSET | 单词配图 | 白色描边PNG @3x，保持原始形状 | /assets/words/{word}.png
```

| 项目 | 规格 |
|------|------|
| 文件命名 | `{单词}.png`，如 `sofa.png`、`cat.png` |
| 背景 | 透明背景（必须，PNG-24 带 Alpha） |
| 描边风格 | **白色外描边，画在图内**，建议 4–6px（设计稿像素值），外描边（Outside）不占图形内部 |
| 描边颜色 | `#FFFFFF` 纯白 |
| 导出尺寸 | 最长边 480px（@3x），等比缩放显示 |
| 占位 | 开发阶段自动生成色块占位，后续逐一替换 |

#### 单词图与房间内容的关联

每章节单词图的色调与该章节房间场景保持呼应，生图时参考对应章节的主题色调：

| 章节 | 主题色调 | 单词图色调参考 |
|------|----------|----------------|
| 1 街角流浪 | 暖米灰 | 灰棕色系，带雨夜感 |
| 2 温暖新家 | 奶黄暖橙 | 暖黄橙色系，温馨感 |
| 3 幼儿园 | 浅天蓝 | 蓝绿色系，活泼清新 |
| 4 公园探险 | 淡草绿 | 绿黄色系，自然户外感 |
| 5 厨房美食 | 奶白暖米 | 暖米色系，食物色彩丰富 |

#### 单词图在不同题型中的展示方式

| 题型 | 单词图展示方式 |
|------|---------------|
| `fill_blank` 填空题 | 卡片顶部大图，辅助理解句子语境 |
| `letter_match` 字母消消乐 | 卡片顶部大图，辅助记忆目标单词 |
| `word_spelling` 单词拼写 | 卡片顶部大图，看图拼写 |
| `crossword` 填字游戏 | 卡片顶部大图，辅助填字 |
| `picture_matching` 图片配对 | **4张单词图作为题目主体**，等比缩小排列在卡片内，不显示顶部大图 |

#### 五种题型

| 题型 ID | 题型名称 | 用户操作 | 判定正确 |
|---------|----------|----------|----------|
| `letter_match` | 字母消消乐 | 拖拽排序字母块与目标单词对齐 | 所有字母位置完全匹配 |
| `word_spelling` | 单词拼写 | 拖动散乱字母块排列成正确顺序 | 拼写与目标单词完全一致 |
| `picture_matching` | 图片配对 | 4 张图片与 4 个英文单词连线 | 4 对全部正确 |
| `fill_blank` | 填空题 | 点选正确答案填入句子空白处 | 选中单词与语义匹配 |
| `crossword` | 填字游戏 | 迷你字格逐字母键入 | 所有字母全部正确 |

**题型比例：** 每关10道，各题型数量按用户难度级别动态分配，详见第12节「难度说明」。

#### AI 自适应难度引擎

这是 WordPet 的核心 AI 能力，分两个层面实时调整学习难度：

**层面1：题内实时微调（每题答完后生效）**

每道题答完后，AI 根据本题表现调整下一题的出题策略：

```typescript
// 根据实时答题表现微调下一题难度
interface AdaptiveSignal {
  recentAccuracy: number;    // 最近 3 题正确率
  attemptCount: number;      // 本题用了几次机会（1=轻松，2=勉强）
  responseSpeed: 'fast' | 'slow'; // 答题速度（可选，用于更精细调整）
}

function adjustNextQuestion(signal: AdaptiveSignal): QuestionAdjustment {
  if (signal.recentAccuracy >= 0.8 && signal.attemptCount === 1) {
    // 连续答对且一次到位 → 提升难度：换更难题型，例句用高级版
    return { difficultyUp: true, sentenceLevel: 'advanced' };
  }
  if (signal.recentAccuracy <= 0.4 || signal.attemptCount === 2) {
    // 连续出错或需要两次 → 降低难度：换更易题型，例句用初级版
    return { difficultyDown: true, sentenceLevel: 'basic' };
  }
  return { keep: true }; // 保持当前难度
}
```

**层面2：关卡结束后大调整（下一关生效）**

每关（10题）结束时，根据整关正确率调整下一关的题型比例：

```typescript
// 关卡结束时调用，调整下一关的题型分配
function adjustNextLevel(levelAccuracy: number, currentDifficulty: 1|2|3|4) {
  if (levelAccuracy >= 0.85) {
    // 正确率高 → 难度上浮一档（不超过4）
    return Math.min(currentDifficulty + 1, 4);
  }
  if (levelAccuracy <= 0.5) {
    // 正确率低 → 难度下浮一档（不低于1）
    return Math.max(currentDifficulty - 1, 1);
  }
  return currentDifficulty; // 保持不变
}
```

> **与初始难度的关系：** 用户在引导页选择的英语水平是起点，AI 自适应在此基础上动态漂移，不会超出合理范围（如纯新手不会被推到最高难度）。调整结果写入 `gameState.difficulty`，用户在个人主页也可手动覆盖。

**gameState 新增字段：**

```typescript
// 自适应难度相关状态
adaptiveDifficulty: {
  current: 1 | 2 | 3 | 4;      // 当前实际难度（AI调整后）
  base: 1 | 2 | 3 | 4;         // 用户选择的基础难度
  levelHistory: number[];       // 各关正确率历史，用于趋势判断
}
```

#### TTS 单词朗读

调用比赛提供的 TTS 接口，在两个场景触发单词朗读：

**场景1：点击单词图片自动朗读**

进入答题页后，用户点击卡片顶部的单词配图，自动朗读该单词：

```
用户点击单词图片
  → TTS 朗读单词（如「sofa」）
  → 停顿 0.5s
  → 朗读中文释义（如「沙发」）
```

**场景2：答错弹窗内点击朗读按钮**

第二次答错弹窗展示正确答案时，弹窗内有朗读按钮：

```
弹窗展示正确答案 [ sofa ]
  → 右侧有 🔊 按钮
  → 点击后 TTS 朗读单词 + 例句
```

**TTS 接入规范：**

```typescript
// 调用比赛提供的 TTS 接口
async function speakWord(word: string, meaning: string, sentence?: string) {
  if (!gameState.settings.soundEnabled) return;

  const text = sentence
    ? `${word}. ${meaning}. ${sentence}`
    : `${word}. ${meaning}`;

  await ttsAPI.speak({
    text,
    lang: 'en-US',   // 单词和例句用英文语音
    rate: 0.9,        // 稍慢，适合学习场景
  });
}
```

> **音效与 TTS 的关系：** TTS 朗读和点击音效共用「游戏音效」开关（`soundEnabled`），关闭音效后 TTS 也不触发。

#### 答题交互与反馈机制

每道题用户有 **最多 2 次作答机会**，答对或用完 2 次后进入下一题。

> **v1.3.1 变更：** 答对和答错第1次均改为底部弹窗自动关闭 + 自动跳转，移除手动按钮，提升答题节奏感。弹窗不使用灰色遮罩，保持题目选项始终清晰可见。

---

**答对流程（第1次或第2次）：**

```
用户选择答案 → 正确
  → 答案选项绿色高亮
  → 底部弹窗从下滑入：显示鼓励文案（无按钮）
  → 0.8s 后弹窗自动关闭，自动跳转下一题
```

**答错第1次：**

```
用户选择答案 → 错误
  → 用户选项红色高亮，不显示正确答案
  → 底部弹窗从下滑入：显示鼓励文案（无按钮，不暴露正确答案，保留再试机会）
  → 1.2s 后弹窗自动关闭，选项恢复默认状态，可重新作答
```

**答错第2次：**

```
用户再次选择答案 → 仍然错误
  → 用户选项红色高亮 + 正确答案绿色高亮
  → 底部弹窗从下滑入：显示鼓励文案 + 正确答案 + 释义/例句
  → 用户点击「下一题 →」手动进入下一题（需要阅读时间，不自动关闭）
```

---

**底部反馈弹窗内容：**

| 场景 | 弹窗内容 | 关闭方式 |
|------|----------|----------|
| 答对 | ✅ 鼓励文案 | 0.8s 后自动关闭并跳转下一题 |
| 答错第1次 | ❌ 鼓励文案（不显示答案） | 1.2s 后自动关闭并恢复选项 |
| 答错第2次 | ❌ 鼓励文案 + 正确答案 + 词义/例句 | 手动点击「下一题 →」|

**答错第2次弹窗结构示意：**

```
┌─────────────────────────────────┐
│  ❌  再想想～                    │
│                                 │
│  正确答案：[ sofa ]             │
│  🛋️ n. 沙发；长沙发             │
│  「Come sit on the sofa.」      │
│                                 │
│  ──────────────────────────── │
│       [ 下一题 → ]              │
└─────────────────────────────────┘
```

**弹窗交互细节：**

| 项目 | 规格 |
|------|------|
| 出现方式 | 从底部滑入，`translateY(100%) → 0`，300ms ease-out |
| 消失方式 | 向下滑出，`translateY(0) → 100%`，200ms ease-in |
| 背后内容 | **无灰色遮罩**，题目选项始终清晰可见 |
| 自动关闭 | 答对 0.8s / 答错第1次 1.2s（答错第2次不自动关闭） |

**鼓励文案库（答对/答错随机轮换，避免重复）：**

```
答对：「完美！」/ 「太棒了！」/ 「就是这样！」/ 「答对啦！」/ 「真厉害！」
答错：「没关系，继续加油！」/ 「差一点～再来！」/ 「记住了，下次一定会！」/ 「别灰心，你可以的！」
```

**视觉颜色规范：**

| 状态 | 选项背景色 | 文字色 |
|------|------------|--------|
| 默认 | `#FFF8E7` | `#5D4037` |
| 答对 | `#66BB6A` | `#fff` |
| 答错（用户选项） | `#EF5350` | `#fff` |
| 正确答案高亮（第2次答错时） | `#66BB6A` | `#fff` |
| 其他选项（答题后） | `#FFF8E7`（`opacity: 0.5`） | `#5D4037` |

- 每题最多 2 次机会；答错 2 次不扣分，计入错题记录；顶部进度文字实时显示「第 x 题 · 共 10 题」

#### 中途退出

- 点退出按钮 → 弹出确认：「退出后本关进度将丢失，确认退出？」
- 关闭/切后台：进度不保存，下次从头开始（已完成关卡解锁状态不受影响）

---

### 7.3 关卡结算页（`/result`）⭐ 核心体验

> 原 `/result` 与 `/reveal` 合并为单页。拼图碎片视觉优先级最高，答题统计为辅助信息。动画逻辑已通过原型确认（v1.3 定稿）。

**触发条件：** 完成 10 道题后自动跳转此页，进入时自动播放本关碎片解锁动画。

#### 页面纵向布局（由上至下）

```
┌─────────────────────────────┐  ← Safe Area Top（52px）
│  顶部标题                    │  获得碎片 · x/4 / 碎片集齐！
│  副标题                      │  集齐 4 片即可合成「家具名」
├─────────────────────────────┤
│                             │
│       置灰剪影               │  家具完整轮廓的灰色剪影，居中
│    （合成后变彩色完整图）      │  占内容区宽度 44%，高度等比
│                             │
├─────────────────────────────┤
│  ░  ░  ░  ░   碎片栏         │  4 个拼图碎片槽，从左到右依次解锁
│                             │  灰色占位 → 彩色碎片（弹跳动画）
├─────────────────────────────┤
│  [ 还差 X 片即可合成 ]        │  固定高度占位区（38px）
│  → 第4关变为「立即合成 ✦」    │  橘黄描边按钮，橘黄文字
├─────────────────────────────┤
│  ── 分割线 ──                │
│  正确率   本轮单词            │  两列并排大数字
│  ✓ 答对 X 题                 │  答题明细
│  ✗ 答错：word · word         │  错词逐一标红
├─────────────────────────────┤
│  弹性空白                    │  吸收剩余空间
├─────────────────────────────┤
│  [ 继续下一关 → ]            │  实心橘黄按钮（前3关）
│  [ 返回房间 → ]              │  合成完成后替换文字
└─────────────────────────────┘  ← Safe Area Bottom（42px）
```

#### 碎片解锁动画（进入页面时自动触发）

- 对应本关碎片槽从灰色占位替换为彩色 `piece_{n}.png`
- 碎片图弹跳：`scale(1→1.22→1)`，250ms，`cubic-bezier(.34,1.56,.64,1)`
- 顶部标题同步更新：「获得碎片 · {n}/4」
- 底部占位文字同步更新：「还差 {4-n} 片即可合成」

#### 合成按钮占位规则

| 状态 | 内容 | 样式 |
|------|------|------|
| 前 3 关（碎片未集齐） | 「还差 X 片即可合成」 | 低饱和度橘黄文字，`opacity: 0.38` |
| 第 4 关（集齐） | 「立即合成 ✦」按钮出现 | 透明背景 + `border: 2px solid #FFB840` + `color: #FFB840` |

> **按钮规范（全局）：** 统一使用透明背景 + 橘黄描边 + 橘黄填充 + 深棕色文字（`#3D1F00`）。详细设计规范后续另行制定。

#### 合成动画时序

```
点击「立即合成」
  → 碎片栏 + 统计区淡出（opacity 0, 220ms）
  → 4 个大碎片从四角飞入中央（各延迟 0/80/80/160ms，500ms）
      flyTL: translate(-65px,-52px) rotate(-12deg) scale(.5) → 原位
      flyTR: translate(+65px,-52px) rotate(+12deg) scale(.5) → 原位
      flyBL: translate(-65px,+52px) rotate(+10deg) scale(.5) → 原位
      flyBR: translate(+65px,+52px) rotate(-10deg) scale(.5) → 原位
  → 碎片淡出（150ms）
  → 置灰剪影淡出（200ms）+ 闪光（opacity 1→0，160ms）
  → 光圈向外扩散消失（700ms）
  → 完整彩色图弹性放大出现：scale(.82→1)，550ms，cubic-bezier(.34,1.26,.64,1)
  → 顶部标题变为「🛋️ 家具名 · 已解锁」
  → 底部按钮文字变为「返回房间 →」（500ms 后）
```

#### 置灰剪影实现规范

置灰剪影和完整彩色图**共用同一张 `full.png`**，CSS 滤镜控制：

```css
/* 置灰剪影：合成前始终显示 */
.sil-gray img {
  filter: grayscale(1) brightness(0.26);
}

/* 完整彩图：初始隐藏，合成后弹出 */
.sil-full img {
  opacity: 0;
  transform: scale(0.82);
}
.sil-full.reveal img {
  transition: opacity 0.55s ease, transform 0.55s cubic-bezier(0.34, 1.26, 0.64, 1);
  opacity: 1;
  transform: scale(1);
}
```

#### 答题统计展示规范

| 项目 | 内容 | 样式 |
|------|------|------|
| 正确率 | 数字 + % | `font-size: 16px, font-weight: 900, color: #FFB840` |
| 本轮单词 | 数字 | 同上 |
| 答对明细 | ✓ 答对 X 题 | `color: rgba(100,210,110,.8)` |
| 答错明细 | ✗ 答错：word · word | `color: rgba(255,110,90,.8)`，错词加粗（答错过1次或2次均计入） |
| 全对时 | 全部答对 🎉 | `color: rgba(100,220,120,.85), font-weight: 900` |

#### 返回房间后

跳转至 `/rooms/:chapterId`，完整家具以飘落入场动画出现在 `roomConfig` 预设坐标：

```css
.furniture-enter {
  animation: furnitureDrop 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes furnitureDrop {
  from { opacity: 0; transform: translateY(-40px) scale(0.85); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
```

#### 低性能降级

```typescript
if (prefersReducedAnimation) {
  // 跳过碎片弹跳和合成飞入动画
  // 直接显示碎片到位状态 / 完整彩图
  // 所有 transition 设为 0ms
}
```

---

### 7.4 房间详情（`/rooms/:chapterId`）

**页面结构（从上至下）：**

```
顶部导航栏
  └── 返回按钮 + 章节名称

房间全景区（核心视觉区域）
  └── 见第 7 节「房间 & 家具系统」详述

信息区
  └── 猫咪图标 + 章节中英文标题 + 进度（x/4 关已完成）

故事线
  └── 章节故事描述（2–4 段，点击 Hero 图回放故事过场）

拼图碎片收集进度
  └── 4 格碎片展示（已解锁碎片显示彩色，未解锁显示灰色占位）
      + 「已集齐 x/4 片」文字说明

已解锁单词（2 列网格）
  └── emoji + 英文 + 中文

家具收集状态（横向滚动）
  ├── 已收集：家具缩略图 + 名称 + ✓
  └── 未收集：❓ + 「完成第x关解锁」

底部【Let's purr!】按钮（固定）
  ├── 显示条件：当前章节有未完成关卡
  └── 点击 → 直接进入单词游戏（无家具预览）
```

---

## 8. 房间 & 家具系统

> 这是产品视觉呈现最核心的模块，也是视觉精致度最重要的部分。

### 8.1 学习结构

**每个房间 = 1 件家具 × 4 片拼图 = 4 关**

| 关卡 | 解锁内容 | 累计题量 |
|------|----------|----------|
| 关卡 1 | 拼图碎片第 1 片（最左） | 10 题 |
| 关卡 2 | 拼图碎片第 2 片 | 20 题 |
| 关卡 3 | 拼图碎片第 3 片 | 30 题 |
| 关卡 4 | 拼图碎片第 4 片（最右）→ 可合成 | 40 题 |

碎片解锁顺序：**固定从左到右**（关卡1→碎片0，关卡4→碎片3），不随机。

### 8.2 技术方案

**房间渲染：背景图 + 独立 PNG 家具按坐标叠加**

```
房间全景 = 背景图 bg.jpg（固定，永不改变）
         + 家具 full.png（absolute 定位，坐标由设计师定义，合成后显示）
         + 猫咪.png（常驻，固定位置）
```

**结算页拼图：置灰剪影 + 4片独立碎片 PNG**

```
结算页视觉 = full.png（CSS grayscale 置灰，作为剪影底图）
           + piece_0~3.png（底部碎片栏，从左到右依次解锁变彩色）
           + 合成动画：碎片飞入 → 剪影消失 → full.png 弹出
```

### 8.3 roomConfig 数据结构

> 每个章节的 `roomConfig` 文件由**设计师在 Paper 中调整好位置后填入数值**，AI 编程工具读取后渲染。
> **坐标和尺寸全部使用 0–1 的小数比例**，相对于房间容器的宽/高，与屏幕尺寸无关，全机型一致。

```typescript
// src/data/rooms/chapter1.ts

export const chapter1RoomConfig: RoomConfig = {
  chapterId: 1,
  name: '街角的纸箱小窝',
  nameEn: 'Street Corner',
  bgImage:    '/assets/rooms/ch1/bg.jpg',   // 首页卡片 + 详情页通顶共用
  frameImage: '/assets/rooms/ch1/frame.png', // 边框，仅首页卡片叠加
  // ↓ 设计师常调：答题页章节背景色
  gameBg: {
    color: '#F5E6C8',
  },

  cat: {
    image: '/assets/cat/idle.png',
    x:     0.42,   // 距左：容器宽度的 42%
    y:     0.68,   // 距顶：容器高度的 68%
    width: 0.15,   // 显示宽度：容器宽度的 15%
  },

  // 每个房间只有 1 件家具（4关拼图合成后解锁）
  furniture: {
    id: 'furniture_ch1',
    name: '纸箱小窝',
    nameEn: 'Cardboard Box Nest',
    fullImage: '/assets/rooms/ch1/furniture/lv1/full.png',
    pieces: [
      '/assets/rooms/ch1/furniture/lv1/piece_0.png',
      '/assets/rooms/ch1/furniture/lv1/piece_1.png',
      '/assets/rooms/ch1/furniture/lv1/piece_2.png',
      '/assets/rooms/ch1/furniture/lv1/piece_3.png',
    ],
    // ↓ 设计师常调：在 Paper 坐标调试模式中拖拽后填入
    x:     0.10,   // 距左：容器宽度的 10%
    y:     0.54,   // 距顶：容器高度的 54%
    width: 0.37,   // 显示宽度：容器宽度的 37%，高度等比缩放
    zIndex: 2,
  },
};
```

### 8.4 TypeScript 类型定义

```typescript
interface FurnitureConfig {
  id: string;           // 格式：furniture_ch{n}
  name: string;         // 中文名
  nameEn: string;       // 英文名
  fullImage: string;    // 完整家具 PNG（房间摆放 + 合成揭示共用）
  pieces: string[];     // 4 张碎片 PNG 路径，index 对应关卡 0-3
  x: number;            // 距左，0–1 小数，相对容器宽度
  y: number;            // 距顶，0–1 小数，相对容器高度
  width: number;        // 显示宽度，0–1 小数，相对容器宽度，高度等比缩放
  zIndex: number;       // 层叠顺序
}

interface CatConfig {
  image: string;
  x: number;            // 距左，0–1 小数
  y: number;            // 距顶，0–1 小数
  width: number;        // 显示宽度，0–1 小数
}

interface RoomConfig {
  chapterId: number;
  name: string;
  nameEn: string;
  bgImage: string;       // 房间图，首页卡片和详情页通顶共用
  frameImage: string;    // 房间边框 PNG，仅首页卡片叠加，详情页不显示
  gameBg: {              // 答题页背景（纯色 + 固定底部白色渐变叠加层）
    color: string;       // 章节纯色背景色
  };
  cat: CatConfig;
  furniture: FurnitureConfig;
}
```

### 8.5 房间渲染组件

```tsx
// components/RoomScene/RoomScene.tsx
interface RoomSceneProps {
  config: RoomConfig;
  roomStatus: 'active' | 'completed' | 'locked'; // 房间状态
  furnitureUnlocked: boolean;  // 家具是否已合成解锁
  isNewlyUnlocked?: boolean;   // 刚刚合成（触发飘落入场动画）
  catAppearance: number;       // 当前猫咪形象编号（来自 gameState.cat）
}

function RoomScene({
  config, roomStatus, furnitureUnlocked, isNewlyUnlocked, catAppearance
}: RoomSceneProps) {
  const f = config.furniture;

  return (
    <div className={`room-scene room-scene--${roomStatus}`}>

      {/* 🖼️ ASSET | 房间背景图 | 375×600pt / @3x → 1125×1800px JPG | /assets/rooms/ch{n}/bg.jpg */}
      <img src={config.bgImage} className="room-bg" alt="" />

      {/* 未解锁：叠加置灰蒙版，不显示家具和猫咪 */}
      {roomStatus === 'locked' && (
        <div className="room-locked-overlay" />
      )}

      {/* 已解锁（进行中 or 已完成）：显示家具 */}
      {roomStatus !== 'locked' && furnitureUnlocked && (
        /* 🖼️ ASSET | 家具完整图 | 透明背景PNG @3x | /assets/rooms/ch{n}/furniture/lv{m}/full.png */
        <img
          src={f.fullImage}
          className={`room-furniture ${isNewlyUnlocked ? 'furniture-enter' : ''}`}
          style={{
            left:   `${f.x     * 100}%`,
            top:    `${f.y     * 100}%`,
            width:  `${f.width * 100}%`,
            zIndex: f.zIndex,
          }}
          alt={f.name}
        />
      )}

      {/* 仅进行中房间显示猫咪 */}
      {roomStatus === 'active' && (
        /* 🖼️ ASSET | 猫咪形象 | 透明背景PNG @3x | /assets/cat/appearance_{n}_idle.png */
        <img
          src={`/assets/cat/appearance_${catAppearance}_idle.png`}
          className="room-cat"
          style={{
            left:  `${config.cat.x     * 100}%`,
            top:   `${config.cat.y     * 100}%`,
            width: `${config.cat.width * 100}%`,
          }}
          alt="猫咪"
        />
      )}

      {/* 🖼️ ASSET | 房间边框 | 透明背景PNG @3x | /assets/rooms/ch{n}/frame.png */}
      {/* 边框层始终叠在最上方，locked 状态下也显示 */}
      <img src={config.frameImage} className="room-frame" alt="" />

    </div>
  );
}
```

```css
/* styles/room.css */

.room-scene {
  position: relative;
  width: 100%;
  /* ↓ 设计师常调：锁定背景宽高比 375:202（全宽生图，首页卡片裁切至311:169） */
  aspect-ratio: 375 / 202;
  overflow: hidden;
  border-radius: 16px;
}

.room-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 房间边框：始终叠在最顶层 */
.room-frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 20;
  pointer-events: none;
}

/* 未解锁：灰色蒙版 */
.room-locked-overlay {
  position: absolute;
  inset: 0;
  /* ↓ 设计师常调：置灰蒙版透明度 */
  background: rgba(0, 0, 0, 0.45);
  z-index: 10;
}

/* 已完成房间：轻微降饱和，视觉上区分于进行中房间 */
.room-scene--completed .room-bg {
  /* ↓ 设计师常调：已完成房间饱和度 */
  filter: saturate(0.75);
}

.room-furniture {
  position: absolute;
  object-fit: contain;
  /* ↓ 设计师常调：家具以底部中心为锚点定位 */
  transform-origin: bottom center;
}

.room-cat {
  position: absolute;
  object-fit: contain;
  transform-origin: bottom center;
  z-index: 5;
}

.furniture-enter {
  animation: furnitureDrop 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes furnitureDrop {
  from { opacity: 0; transform: translateY(-40px) scale(0.85); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
```

### 8.6 坐标调试工具（Paper 微调辅助）

AI 编程工具生成一个开发模式下的坐标编辑叠层，设计师在 Paper 中直接拖拽家具和猫咪，实时显示百分比坐标，复制后粘回 `roomConfig` 即可生效：

```
开发模式下（?debug=room）：
  - 家具和猫咪元素可拖拽、可缩放
  - 拖拽时实时显示 x、y、width 的小数值（0–1）
  - 右下角「复制配置」按钮，输出当前所有元素的 JSON 片段
    例：{ x: 0.10, y: 0.54, width: 0.37, zIndex: 2 }
  - 复制后直接粘贴替换 roomConfig 中对应字段，保存即生效
```

---

## 9. 剧情过场系统

> v1.2 完整重写：从对话气泡模式改为 PPT 多图 + 配乐形式。

### 9.1 概述

- 每章节有一段故事过场，由 3–6 张全屏图片 + 一首配乐构成
- 图片按顺序自动播放（或用户点击翻页）
- 首次解锁章节时自动触发；之后可从房间详情手动回看
- 支持跳过（右上角跳过按钮，长按 0.5s 确认跳过）

### 9.2 storyConfig 数据结构

```typescript
// src/data/story/chapter1.ts

export const chapter1StoryConfig: StoryConfig = {
  chapterId: 1,
  bgm: '/assets/story/ch1/bgm.mp3',
  autoAdvanceMs: 3500,    // 每张图自动翻页间隔（ms），0 = 仅手动
  slides: [
    {
      id: 'ch1_s1',
      image: '/assets/story/ch1/slide_01.jpg',
      caption: '',          // 留空 = 无字幕叠加（文字已画入图内）
      duration: 3500,       // 此张图停留时长（覆盖全局设置）
    },
    {
      id: 'ch1_s2',
      image: '/assets/story/ch1/slide_02.jpg',
      caption: '一个雨夜，Momo 躲在街角的纸箱里……',  // 有字幕时叠加在图片下方
      duration: 4000,
    },
    {
      id: 'ch1_s3',
      image: '/assets/story/ch1/slide_03.jpg',
      caption: '',
      duration: 3500,
    },
  ],
};

interface SlideConfig {
  id: string;
  image: string;          // 全屏图路径，375×667pt 设计 / @3x 导出
  caption?: string;       // 字幕文字，留空则不显示
  duration?: number;      // 停留时长（ms）
}

interface StoryConfig {
  chapterId: number;
  bgm: string;            // 配乐路径
  autoAdvanceMs: number;  // 全局自动翻页间隔
  slides: SlideConfig[];
}
```

### 9.3 过场页面交互

```
进入过场页
  → 配乐淡入播放（fadeIn 500ms）
  → 第一张图片全屏展示（fade in 400ms）
  → 按 duration 自动切换，或用户左右滑动 / 点击右侧切换

每张图切换：
  → 图片交叉淡化（crossfade 400ms）
  → 字幕（如有）从下方 fade up 进入

最后一张图结束：
  → 配乐渐弱（fadeOut 1000ms）
  → 黑屏 → 「第X章 完成！」文字
  → 自动跳转首页 /

跳过按钮：
  → 右上角常驻显示「跳过」
  → 点击立即跳转首页，配乐停止
```

#### 过场静音按钮

过场播放时全局 BGM 自动暂停，由过场专属配乐接管；过场结束或跳过后，全局 BGM 恢复播放。

过场期间提供独立静音按钮，仅控制本次过场配乐：

- 位置：右上角，与「跳过」按钮并排
- 状态：🔊 / 🔇 切换
- 作用范围：仅当前过场配乐，不影响全局音乐开关
- 本次静音选择**不写入** `gameState.settings`，下次过场默认仍有声音

```typescript
// 进入过场页
globalBgm.pause();           // 全局 BGM 暂停
storyBgm.play();             // 过场配乐开始

// 过场结束 / 跳过
storyBgm.stop();             // 过场配乐停止
if (settings.musicEnabled) {
  globalBgm.resume();        // 全局 BGM 恢复（若全局开关为开）
}
```

---

## 10. 状态数据模型

### 存储方式

```
localStorage key: "wordpet_state"
值：JSON.stringify(GameState)
```

### 完整 Schema

```typescript
interface GameState {
  version: string;              // 当前 "1.3"
  sessionId: string;            // UUID v4，首次生成后永久保存
  cat: {                        // 猫咪自定义数据（新增）
    name: string;               // 用户起的名字，最多 10 字符
    appearance: number;         // 预设形象编号，从 1 开始
    gender: 'male' | 'female'; // 性别，影响对话文案语气
    personality: 'homebody' | 'lively' | 'sleepy' | 'mysterious';
  };
  onboardingDone: boolean;      // 是否完成过新手引导（新增）
  difficulty: 1 | 2 | 3 | 4;   // 英语水平：1=纯新手 2=略知一二 3=勉强应付 4=还不错哦
  adaptiveDifficulty: {         // AI 自适应难度状态（新增）
    current: 1 | 2 | 3 | 4;   // 当前实际难度（AI实时调整后）
    base: 1 | 2 | 3 | 4;      // 用户选择的基础难度（锚点）
    levelHistory: number[];    // 各关正确率历史，用于趋势判断
  };
  currentChapter: number;       // 当前章节（1–5）
  currentLevel: number;         // 当前关卡（1–4）
  completedLevels: {
    [key: string]: {            // key："chapterId-levelId"，例如 "1-2"
      accuracy: number;         // 正确率（0–1）
      completedAt: string;      // ISO 8601
    };
  };
  unlockedFurniture: string[];  // 已合成解锁的家具 ID，格式："furniture_ch{n}"
  wordHistory: {
    [word: string]: {
      correct: number;
      wrong: number;
      lastSeen: string;
      mastered?: boolean;       // 用户手动标记「已掌握」
    };
  };
  storyProgress: {
    [key: string]: boolean;     // "chapter_{n}": 是否已看过
  };
  settings: {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
  };
}
```

### 示例数据

```json
{
  "version": "1.3",
  "sessionId": "f3a2b1c4-d5e6-7890-abcd-ef1234567890",
  "currentChapter": 2,
  "currentLevel": 2,
  "completedLevels": {
    "1-1": { "accuracy": 0.9, "completedAt": "2026-03-01T10:00:00Z" },
    "1-2": { "accuracy": 0.8, "completedAt": "2026-03-02T09:30:00Z" },
    "1-3": { "accuracy": 1.0, "completedAt": "2026-03-03T11:00:00Z" },
    "1-4": { "accuracy": 0.9, "completedAt": "2026-03-04T10:00:00Z" },
    "2-1": { "accuracy": 0.7, "completedAt": "2026-03-10T08:00:00Z" }
  },
  "unlockedFurniture": [
    "furniture_ch1"
  ],
  "wordHistory": {
    "cat":  { "correct": 3, "wrong": 0, "lastSeen": "2026-03-04T10:00:00Z" },
    "sofa": { "correct": 2, "wrong": 1, "lastSeen": "2026-03-10T08:00:00Z" }
  },
  "storyProgress": {
    "chapter_1": true,
    "chapter_2": false
  },
  "settings": {
    "soundEnabled": true,
    "vibrationEnabled": false
  }
}
```

### 关卡解锁规则

```
完成 n-m → 解锁 n-(m+1)
完成章节全部 4 关（n-1 ~ n-4）→ 解锁 (n+1)-1
判断：completedLevels["n-m"] 存在 = 已完成

家具合成规则：
  章节 n 的 completedLevels["n-1"] ~ ["n-4"] 全部存在
  → unlockedFurniture 中加入 "furniture_ch{n}"
  → 重复合成检查：unlockedFurniture.includes("furniture_ch{n}") 为 true 则跳过
```

---

## 11. 技术实现规范

### 11.1 项目结构

```
src/
├── data/
│   ├── rooms/
│   │   ├── chapter1.ts     # roomConfig（含家具坐标）
│   │   ├── chapter2.ts
│   │   └── index.ts
│   ├── story/
│   │   ├── chapter1.ts     # storyConfig（含图片路径、配乐）
│   │   └── index.ts
│   └── words/
│       ├── chapter1.ts     # 词汇与关卡题目数据
│       └── index.ts
├── store/
│   ├── gameStore.ts        # 唯一 localStorage 读写入口
│   └── migrate.ts          # 数据版本迁移
├── pages/
│   ├── Home/
│   ├── Room/               # 房间详情，含 RoomScene 组件
│   ├── Game/               # 单词游戏
│   ├── Result/             # 关卡结算页（拼图碎片 + 合成动画 + 答题统计）
│   └── Story/              # 剧情过场
├── components/
│   ├── RoomScene/          # 房间渲染（背景+家具叠加）
│   ├── PuzzleResult/       # 结算页拼图碎片 + 合成动画
│   ├── StoryPlayer/        # 剧情过场播放器
│   ├── WordQuestion/       # 五种题型组件
│   ├── LoadingTransition/  # 全局加载过渡动画（Learn/play/purr）
│   └── BottomNav/
├── styles/
│   ├── room.css            # 房间相关样式（Paper 微调主要改这里）
│   ├── result.css          # 结算页样式（拼图碎片 + 合成动画）
│   ├── story.css           # 剧情过场样式
│   └── tokens.css          # 设计 token（颜色、圆角、字体、Safe Area）
└── hooks/
    ├── useGameStore.ts
    └── useAnimation.ts
```

### 11.2 Paper / Vibe Coding 友好约定

为了让「AI 编程工具生成 → Paper 微调 → AI 编程工具迭代」多轮循环顺畅，所有代码生成必须遵守以下规范。

#### 核心原则

**① 样式与逻辑完全分离**

每个组件对应一个独立的 `.css` 文件，组件逻辑文件（`.tsx`）中不写任何内联样式，动态坐标等纯计算值除外。Paper 微调时只动 `.css`，不碰 `.tsx`。

```
Button.tsx     ← 只写结构和交互逻辑
Button.css     ← 所有视觉样式在这里，Paper 改这个文件
```

**② 所有视觉参数集中在 tokens.css**

颜色、圆角、阴影、间距、字号全部用 CSS 变量，组件引用变量名而不是硬编码值。改一个变量，全局生效。

```css
/* ✅ 正确 */
border-radius: var(--radius-btn);
box-shadow:    var(--shadow-btn);

/* ❌ 禁止 */
border-radius: 24px;
box-shadow: 0 5px 0 #A06800;
```

**③ 状态用 className 切换，不用 JS 动态 style**

```tsx
/* ✅ Paper 能直接看到所有状态的 CSS，可以一起调 */
<button className={`btn ${disabled ? 'btn--disabled' : 'btn--active'}`}>

/* ❌ 避免，Paper 里看不到 disabled 状态的样式 */
<button style={{ opacity: disabled ? 0.4 : 1 }}>
```

**④ 布局用 flex + gap，不用 margin 堆叠**

```css
/* ✅ 调间距只改一个值 */
.card-list { display: flex; flex-direction: column; gap: var(--space-md); }

/* ❌ 改间距要逐个找 */
.card:nth-child(1) { margin-bottom: 12px; }
.card:nth-child(2) { margin-bottom: 8px; }
```

**⑤ 图片路径通过 props 传入，组件内不硬编码**

```tsx
/* ✅ 设计师替换图片只改数据层，不改组件 */
<RoomScene bgImage={config.bgImage} />

/* ❌ 禁止 */
<img src="/assets/rooms/ch1/bg.jpg" />
```

**⑥ 「设计师常调项」注释**

CSS 文件中标注哪些参数是 Paper 微调时常改的，方便快速定位：

```css
/* ↓ 设计师常调：按钮圆角 */
border-radius: var(--radius-btn);

/* ↓ 设计师常调：底部阴影厚度（数值越大3D感越强） */
--shadow-btn-depth: 5px;

/* ↓ 设计师常调：卡片内边距 */
padding: var(--padding-card);
```

**⑦ 坐标数据与渲染分离**

家具坐标、碎片位置等设计数据在 `data/rooms/` 中定义，渲染组件只负责读取，不内嵌具体数值。

**⑧ 占位符不塌陷**

图片资产未上传时，用色块 + 尺寸文字占位，保证布局结构可在 Paper 中正常预览。

**⑨ 资产替换位置标注**

所有需要替换真实图片的占位处，统一用 `/* 🖼️ ASSET */` 注释标注，说明图片用途、规格和对应的文件路径规范，方便后续搜索定位和替换。

CSS 中的占位色块：

```css
/* 🖼️ ASSET | 房间背景图 | 375×600pt / @3x → 1125×1800px JPG | /assets/rooms/ch{n}/bg.jpg */
.room-bg {
  background: #C8B898;   /* 占位色，替换为真实图片后移除 */
}
```

TSX 中的图片 src：

```tsx
{/* 🖼️ ASSET | 家具完整图 | 透明背景PNG | /assets/rooms/ch{n}/furniture/lv{m}/full.png */}
<img src={furniture.fullImage || '/placeholder/furniture.png'} alt={furniture.name} />

{/* 🖼️ ASSET | 拼图碎片 0 | 透明背景PNG | /assets/rooms/ch{n}/furniture/lv{m}/piece_0.png */}
<img src={furniture.pieces[0] || '/placeholder/piece.png'} alt="碎片1" />

{/* 🖼️ ASSET | 剧情图片 | 375×667pt / @3x → 1125×2001px JPG | /assets/story/ch{n}/slide_{nn}.jpg */}
<img src={slide.image || '/placeholder/slide.png'} alt="" />

{/* 🖼️ ASSET | 猫咪角色 | 透明背景PNG | /assets/cat/idle.png */}
<img src={catImage || '/placeholder/cat.png'} alt="Momo" />
```

> 替换素材时只需在项目中搜索 `🖼️ ASSET` 即可定位所有待替换位置。

---

#### AI 编程工具提需固定附加语

每次向 AI 编程工具提需时，在末尾附加以下要求，确保生成代码符合以上规范：

```
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
11. 所有模块间距、元素尺寸、内边距必须使用 tokens.css 中的间距变量
    （--space-xs/sm/md/lg/xl 或具体场景变量如 --room-card-gap），
    不得硬编码 px 数值，方便设计师在 tokens.css 中集中调整
```

---

#### 分阶段开发路线图

**不要一次要求完整功能**，按以下三阶段推进，每阶段在 Paper 里确认视觉后再进入下一阶段：

```
阶段一：骨架搭建
  ├── 搭建所有路由和空白页面（只有标题和占位文字）
  ├── 底部导航栏可跳转
  ├── tokens.css 色值、字体、Safe Area 全部到位
  └── 目标：Paper 里能看到完整的页面结构和导航流程

阶段二：逐页实现（推荐顺序）
  ├── 1. 首页（背景渐变 + 底部场景图 + 房间卡片占位）
  ├── 2. 自定义猫咪页（英语水平选择 + 猫咪自定义）
  ├── 3. 房间详情页
  ├── 4. 单词游戏页（先做1种题型跑通流程）
  ├── 5. 关卡结算页（拼图碎片动画）
  ├── 6. 剧情过场页
  └── 每完成一页：Paper 微调视觉 → 确认 → 再做下一页

阶段三：素材替换 & 收尾
  ├── 搜索 🖼️ ASSET，逐一替换真实图片
  ├── 搜索 bgm-home.mp3 / bgm-game.mp3，替换真实音频
  ├── 联调所有页面间跳转
  └── iOS Safari 真机测试（Safe Area、字体渲染）
```

---

#### Paper 微调速查表

在 Paper 里调整视觉时，按页面找到对应文件直接改：

| 要改什么 | 改哪个文件 |
|----------|------------|
| **全局颜色、圆角、阴影、字号、间距** | `styles/tokens.css` ← **所有尺寸和间距调整优先看这里** |
| 首页背景渐变色、底部图高度 | `styles/home.css` |
| 房间卡片尺寸、边框对齐 | `styles/home.css` → `.room-card` |
| 首页房间卡片间距 | `styles/tokens.css` → `--room-card-gap` |
| 页面左右边距 | `styles/tokens.css` → `--page-padding-x` |
| 按钮高度 | `styles/tokens.css` → `--btn-height-sm/md/lg` |
| 结算页各区块间距 | `styles/tokens.css` → `--result-section-gap` |
| 答题页选项间距 | `styles/tokens.css` → `--game-option-gap` |
| 房间内家具/猫咪位置 | `src/data/rooms/chapter{n}.ts` → x/y/width 值 |
| 答题页背景色 | `src/data/rooms/chapter{n}.ts` → `gameBg.color` |
| 答题页白色卡片尺寸、圆角、阴影 | `styles/game.css` → `.game-card` |
| 单词配图圆形大小、压卡片偏移量 | `styles/game.css` → `.game-word-image` |
| TTS 朗读触发的点击区域样式 | `styles/game.css` → `.game-word-image`（点击图片触发）|
| 答题页选项按钮样式 | `styles/game.css` → `.game-option` |
| 答题反馈底部弹窗样式 | `styles/game.css` → `.feedback-sheet` |
| 结算页拼图碎片布局 | `styles/result.css` |
| 过场图片切换速度 | `styles/story.css` → transition duration |
| 加载动画文字节奏 | `components/LoadingTransition/LoadingTransition.css` |
| iOS Safe Area 上下边距 | `styles/tokens.css` → `--safe-top` / `--safe-bottom` |

---

#### 每次提需前防坑 Checklist

提需之前，先过一遍这个清单：

```
□ 本次提需末尾有没有附上「代码规范要求」固定附加语？
□ 有没有要求「图片全部用色块占位，不引用外部 URL」？
□ 如果涉及新增页面，有没有同时要求创建对应的 .css 文件？
□ 如果涉及 gameState 字段变更，有没有提到更新 migrate.ts？
□ 提需描述是否足够具体？（「做一个按钮」→「做一个橘黄色圆角按钮，
  点击时缩放 0.95，样式参考 tokens.css 中的 btn-primary」）
□ 上一次 Paper 微调的改动有没有同步给 AI 编程工具？
  （Paper 改了 CSS，AI 编程工具不知道，下次生成会覆盖掉）
```

---

#### 常见坑与解法

| 坑 | 原因 | 解法 |
|----|------|------|
| Paper 改了但 AI 工具下次覆盖 | AI 编程工具不感知 Paper 的改动 | 每次提需前把 Paper 里改过的值同步告知 AI 编程工具 |
| 首页加载很慢 | 所有房间图一次性加载 | 提需时要求「RoomScene 使用 IntersectionObserver 懒加载」 |
| 真机上内容被刘海遮挡 | Safe Area 没生效 | 确认所有页面根容器用了 `.page-root`（padding-top: var(--safe-top)） |
| 换了图片但布局塌陷 | 占位图和真实图尺寸不一致 | 图片容器固定宽高比，用 `object-fit: cover`，不依赖图片自然尺寸 |
| gameState 读取报错 | 旧版本数据字段缺失 | 每次改数据结构都要更新 `store/migrate.ts` |
| 动画在低端机卡顿 | 没做降级处理 | 提需时要求「复用 useAnimation hook，prefersReducedAnimation 时跳过动画」 |

---

#### 工具链与 MCP 建议

**Motiff MCP 接入（设计→开发提效）**

Motiff 支持 MCP，可与 Claude Code 直接连接，让 Claude Code 读取 Motiff 设计稿的结构数据（图层、间距、颜色 token），直接生成对应组件代码，减少手动描述尺寸的工作量：

```
Motiff 开启 Dev Mode MCP Server
  → Claude Code 连接 Motiff MCP
  → 提需时说「参考 Motiff 中选中的组件生成代码」
  → Claude Code 读取真实设计数据，不靠猜测截图
```

具体接入方式参考 Motiff 官方文档中的 MCP 配置说明，接入后在 Claude Code 的 `.mcp.json` 中添加对应 server 配置。

**PRD 文档作为 AI 编程工具的持久上下文**

把本文档放进项目根目录，每次开启新会话时先让 AI 编程工具读这个文件：

```
「请先阅读项目根目录下的 WordPet_PRD_v1.3_final.md，
  然后我们开始做第 X 节的功能。」
```

这样不需要每次重新解释背景、数据结构、命名规范，大幅减少沟通成本。

**版本管理（git tag）**

每完成一个阶段，让 AI 编程工具执行 git tag：

```bash
# 提需示例
「当前首页视觉已在 Paper 里确认，请执行 git add . && git commit -m 'feat: home page visual' && git tag v0.1-home」
```

出问题可以快速回滚，不怕改坏。

---

#### 测试建议

**① 真机优先于模拟器**

iOS Safari 对部分 CSS 属性的处理与 Chrome 不同，以下属性必须真机验证：
- `position: fixed`（iOS Safari 有特殊行为）
- `backdrop-filter: blur`（部分机型不支持）
- `aspect-ratio`（低版本 iOS 需要 polyfill）
- Safe Area 上下边距是否生效

建议每完成一页就在 iPhone 真机上过一遍，不要等全部完成再集中测试。

**② 让 AI 编程工具生成关键逻辑的测试用例**

不需要懂测试框架，直接提需：

```
「为 store/gameStore.ts 中的 completeLevel 函数写单元测试，
  覆盖以下场景：
  1. 完成第1-3关，碎片数量正确递增
  2. 完成第4关，furniture 解锁状态正确
  3. 旧版本 gameState 数据迁移后字段完整」
```

**③ 弱网降级测试**

在 Chrome DevTools → Network → 选择 Slow 3G，测试：
- 加载过渡动画是否正常触发
- 图片占位色块是否正常显示（不塌陷）
- BGM 加载失败时是否静默处理（不报错）

---

#### 落地部署建议

**部署**：使用 Paper 自带静态托管，HashRouter 已配置好，直接发布链接分享测试。

**用户反馈收集**：在个人主页加简单反馈入口，让 AI 编程工具生成一个表单，提交内容发到指定邮箱：

```
「在 /profile 页面底部添加一个「反馈建议」入口，
  点击弹出简单表单（文本输入 + 提交），
  提交后通过 mailto: 发送到 [你的邮箱]，
  不需要后端」
```

**首页视觉基准先行**：正式开发前，先让 AI 编程工具做首页静态原型（只有视觉，无交互），在 Paper 里微调到满意后作为整个项目的视觉基准，后续所有页面的颜色、间距、组件风格以此为准，避免各页面风格不统一。

### 11.3 CSS Token 文件

```css
/* styles/tokens.css */
:root {
  /* ── iOS Safe Area（全局规范，所有页面统一遵守） ──
     Dynamic Island 机型：Status Bar = 44px，缓冲 8px → 上边距 52px
     Home Indicator：34px，缓冲 8px → 下边距 42px
     所有页面内容区必须在此范围内，禁止内容进入安全区域 */
  --safe-top:    52px;
  --safe-bottom: 42px;

  /* 颜色 */
  --color-primary:      #FFB840;
  --color-primary-dark: #A06800;
  --color-teal:         #4ECDC4;
  --color-teal-dark:    #2BABA2;
  --color-bg:           #FFF8E7;
  --color-bg-dark:      #0D0A07;
  --color-text:         #5D4037;
  --color-text-light:   #8D6E63;
  --color-success:      #66BB6A;
  --color-error:        #EF5350;
  --color-overlay:      rgba(30, 20, 10, 0.85);

  /* 圆角 */
  --radius-sm:   8px;
  --radius-md:   12px;
  --radius-lg:   20px;
  --radius-full: 999px;

  /* 卡片阴影（ChunkyToybox 实色阴影） */
  --shadow-card: 0 4px 0 0 #C07800;
  --shadow-btn:  0 4px 0 0 #A06800;
  --shadow-teal: 0 4px 0 0 #1E9990;

  /* 字体 */
  --font-en: 'Nunito', sans-serif;
  --font-zh: 'PingFang SC', sans-serif;

  /* 动画时长 */
  --duration-fast:   150ms;
  --duration-normal: 300ms;
  --duration-slow:   600ms;

  /* ──────────────────────────────────────────
     ↓ 设计师常调：间距系统
     所有模块间距、内边距、元素尺寸统一在此调整
     修改后全局生效，无需逐个组件查找
     ────────────────────────────────────────── */

  /* 基础间距单位 */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  12px;
  --space-lg:  16px;
  --space-xl:  24px;
  --space-2xl: 32px;
  --space-3xl: 48px;

  /* ↓ 设计师常调：页面左右边距 */
  --page-padding-x: 20px;

  /* ↓ 设计师常调：首页房间卡片间距 */
  --room-card-gap: 16px;

  /* ↓ 设计师常调：底部导航栏高度 */
  --bottom-nav-height: 64px;

  /* ↓ 设计师常调：结算页各区块间距（碎片栏/合成按钮/统计信息） */
  --result-section-gap: 12px;

  /* ↓ 设计师常调：答题页题目卡片与选项之间的间距 */
  --game-question-gap: 20px;

  /* ↓ 设计师常调：答题页单词配图尺寸（图片高度的一半会压入卡片内） */
  --word-image-size: 160px;

  /* ↓ 设计师常调：答题页选项按钮之间的间距 */
  --game-option-gap: 10px;

  /* ↓ 设计师常调：房间详情页各区块间距 */
  --room-detail-section-gap: 24px;

  /* ↓ 设计师常调：自定义猫咪页各步骤间距 */
  --onboarding-section-gap: 20px;

  /* ↓ 设计师常调：按钮高度（影响所有主要按钮） */
  --btn-height-sm: 38px;
  --btn-height-md: 48px;
  --btn-height-lg: 56px;

  /* ↓ 设计师常调：卡片内边距 */
  --padding-card: 16px 20px;
}

/* ── 全局 Safe Area 应用（所有页面根容器使用） ── */
.page-root {
  padding-top:    var(--safe-top);
  padding-bottom: var(--safe-bottom);
}

/* ── 按钮规范（全局）──
   统一样式：透明背景 + 橘黄描边 + 橘黄填充 + 深棕色文字
   详细设计规范后续另行制定 */
.btn-primary {
  background:    var(--color-primary);
  border:        2px solid var(--color-primary);
  border-radius: var(--radius-full);
  color:         #3D1F00;
  font-weight:   900;
  box-shadow:    var(--shadow-btn);
}
.btn-primary:active {
  transform:  translateY(3px);
  box-shadow: 0 1px 0 0 var(--color-primary-dark);
}

/* 次级 / 待激活状态（如合成按钮集齐前的占位态）：
   透明背景 + 橘黄描边，文字也用橘黄，传达「可操作」而不抢主视觉 */
.btn-outline {
  background:    transparent;
  border:        2px solid var(--color-primary);
  border-radius: var(--radius-full);
  color:         var(--color-primary);
  font-weight:   900;
}
.btn-outline:active {
  background: var(--color-primary);
  color:      #3D1F00;
  transform:  scale(0.97);
}
```

### 11.4 数据访问规范

```typescript
// ✅ 正确：统一通过 gameStore
import { useGameStore } from '@/store/gameStore';
const { completeLevel, unlockFurniture, state } = useGameStore();

// ❌ 禁止在组件内直接操作 localStorage
localStorage.setItem('wordpet_state', JSON.stringify(...));
```

**写操作防抖：** 300ms，避免频繁序列化。

### 11.5 首页懒加载规范

首页同时渲染多个 `RoomScene`，需避免一次性加载所有房间图片：

```typescript
// 只渲染视口内及相邻一屏的 RoomScene，其余用占位色块代替
// 使用 IntersectionObserver 检测卡片是否进入视口

function RoomCard({ config, isVisible }: RoomCardProps) {
  return isVisible
    ? <RoomScene config={config} ... />          // 完整渲染
    : <div className="room-card-placeholder" />  // 占位色块，保持布局不跳动
}
```

- 预加载范围：当前视口 + 上下各一张卡片
- 滚出视口超过 2 张卡片距离后可卸载，节省内存
- 占位色块高度与 RoomScene 一致，避免滚动时布局跳动

### 11.6 数据版本迁移规范

每次 `GameState` 结构变化时，`store/migrate.ts` 负责将旧数据迁移至新版本：

```typescript
// store/migrate.ts
function migrate(raw: any): GameState {
  const version = raw?.version ?? '1.0';

  // v1.2 → v1.3：新增 cat、onboardingDone 字段
  if (version < '1.3') {
    raw.cat = raw.cat ?? {
      name: 'Momo',
      appearance: 1,
      gender: 'female',
      personality: 'homebody',
    };
    raw.onboardingDone = raw.onboardingDone ?? true; // 老用户视为已完成引导
    raw.version = '1.3';
  }

  return raw as GameState;
}

// 读取时自动迁移
const raw = JSON.parse(localStorage.getItem('wordpet_state') || 'null');
const state = raw ? migrate(raw) : createDefaultState();
```

迁移原则：
- 新增字段给合理默认值，老用户数据不丢失
- 老用户 `onboardingDone` 默认设为 `true`，不重新触发引导流程
- 迁移失败时清空数据，重新走首次启动流程（兜底）

| 场景 | 实现 | 低性能降级 |
|------|------|------------|
| 拼图碎片解锁弹跳 | `transform: scale(1→1.22→1)` 250ms | 直接到位，无弹跳 |
| 合成碎片飞入 | `transform: translate + rotate + scale` 500ms | 跳过，直接显示完整图 |
| 置灰剪影炸开 | `opacity 0.2s` + `scale` 弹出 | 直接切换 |
| 家具入场（飘落到位） | `transform: translateY + scale` 600ms | 直接出现 |
| 剧情图片切换 | `opacity` crossfade 400ms | 直接切换 |
| 答对/答错反馈 | `background-color` transition 100ms | 无需降级 |
| 进度条推进 | `width` transition 300ms | 无需降级 |

```typescript
// hooks/useAnimation.ts
export function useAnimation() {
  const prefersReducedAnimation =
    navigator.hardwareConcurrency <= 2 ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return { prefersReducedAnimation };
}
```

### 11.7 音频处理

#### 音频类型

| 类型 | 说明 | 默认状态 | 设置开关 |
|------|------|----------|----------|
| BGM（背景音乐） | 各页面/场景循环播放的背景配乐 | **默认开启** | 游戏音乐开关 |
| 过场配乐 | 章节剧情过场期间播放的专属配乐，进入过场时全局 BGM 自动暂停，过场结束后恢复 | **默认开启** | 过场内静音按钮（独立控制，不影响全局音乐开关） |
| 点击音效 | 用户点击任意可交互元素时触发的短音效 | **默认开启** | 游戏音效开关 |

#### BGM 播放规范

```typescript
// 各场景 BGM 淡入淡出
const audio = new Audio(bgmSrc);
audio.loop = true;
audio.volume = 0;
audio.play();
// 淡入：500ms 内将 volume 从 0 → 0.8
// 淡出：离开页面时 1000ms 内将 volume 降至 0，再 pause()

// gameState.settings.musicEnabled = false 时：不播放，跳过所有 BGM 操作
```

各页面 BGM 来源：

| 页面 / 场景 | BGM 来源 | 备注 |
|-------------|----------|------|
| 首页 | `/assets/audio/bgm-home.mp3` | 占位，待替换 |
| 剧情过场 | `storyConfig.bgm`，各章节独立配乐 | 过场内有独立静音按钮，不影响全局开关 |
| 答题页 | `/assets/audio/bgm-game.mp3` | 占位，待替换 |
| 其他页面 | 沿用上一个场景 BGM 或静音 | — |

#### BGM 风格指引

整体音乐方向：**温柔轻松的木吉他 + 钢片琴**组合，有手作感，不抢戏，与插画风格呼应。生成工具推荐 **Suno AI**，关键词参考：`lo-fi, ukulele, warm, cat café, children game`。

| 场景 | 风格 | BPM | 参考感觉 |
|------|------|-----|----------|
| 首页 BGM | 慵懒轻爵士 | ~75 | 午后阳光、猫咪打盹的氛围 |
| 答题页 BGM | 轻快木琴 | ~100 | 专注但不紧张，像在做有趣的事 |
| 章节过场 BGM（各章节差异化） | 弦乐为主，各章节有主题色 | — | ch1街角：忧郁口琴；ch2暖家：温柔钢琴 |
| 合成动画瞬间音效 | 短促竖琴 + 铃声上扬 | — | 「叮」的一声，解锁感 |
| 点击音效 | 木质短促敲击声 | — | 像积木碰撞，轻快不刺耳 |

#### 点击音效规范

```typescript
// 全局点击音效，挂载在所有可交互元素上
// 音效文件：/assets/audio/sfx-click.mp3
function playClickSfx() {
  if (!gameState.settings.soundEnabled) return;
  const sfx = new Audio('/assets/audio/sfx-click.mp3');
  sfx.volume = 0.6;
  sfx.play();
}
// 触发时机：button、卡片、选项等所有 onClick 事件
// 音效时长建议 < 200ms，短促清脆
```

#### 设置状态持久化

```typescript
// gameState.settings 字段（已在数据模型中定义）
settings: {
  musicEnabled: true,   // 默认开启
  soundEnabled: true,   // 默认开启
}
// 用户在设置弹窗切换后立即写入 localStorage，下次启动时恢复
```

---

## 12. 章节内容规划

### 章节总览

| 章节 | 人生阶段 | 场景标识 | 词汇范围 | 词长 | 关卡数 | 家具 |
|------|----------|----------|----------|------|--------|------|
| 1 | 街角流浪 | `street_corner` | 基础名词（cat, box, rain, door, bag） | 3–4 字母 | **4** | 纸箱小窝 |
| 2 | 温暖新家 | `living_room` | 家居物品（sofa, lamp, book, cup, mat） | 3–4 字母 | **4** | 柔软沙发 |
| 3 | 幼儿园 | `kindergarten` | 学校用品（desk, pen, rule, ball, cake） | 4–5 字母 | **4** | 小课桌 |
| 4 | 公园探险 | `park` | 自然与社交（tree, duck, park, friend, happy） | 4–5 字母 | **4** | 公园长椅 |
| 5 | 厨房美食 | `kitchen` | 食物与动作（cook, rice, bread, knife, taste） | 5–7 字母 | **4** | 小餐桌 |

> 每章节 4 关 × 10 题 = **40题/章**，每关解锁一片拼图碎片，4片集齐后合成家具。

### 家具对照（每章1件，4关合成）

| 章节 | 家具 ID | 中文名 | 英文名 | 参考 Emoji |
|------|---------|--------|--------|------------|
| 1 | `furniture_ch1` | 纸箱小窝 | Cardboard Box Nest | 📦 |
| 2 | `furniture_ch2` | 柔软沙发 | Cozy Sofa | 🛋️ |
| 3 | `furniture_ch3` | 小课桌 | Little Desk | 🪑 |
| 4 | `furniture_ch4` | 公园长椅 | Park Bench | 🪵 |
| 5 | `furniture_ch5` | 小餐桌 | Dining Table | 🍽️ |

> 每件家具对应 5 张图：`piece_0~3.png`（4片拼图碎片）+ `full.png`（完整图）

### 难度说明（方案C：AI自适应 + 例句难度 + 题型比例三维差异化）

章节单词内容固定，所有用户学习相同的25个单词。**难度通过三个维度实现差异化：**

1. **AI 实时自适应**：每题答完后微调下一题，每关结束后调整下一关（详见第7.2节「AI 自适应难度引擎」）
2. **例句难度**：每个单词配置两套例句（初级/高级），按当前难度级别选用
3. **题型比例**：不同级别调整每关10道题中各题型的出题数量

这样一套素材图就能支撑四种不同的学习体验，后续再迭代单词内容也不影响难度系统。

#### 题型比例对照表

每关固定10道题，按难度级别分配各题型数量：

| 题型 | 纯新手 | 略知一二 | 勉强应付 | 还不错哦 |
|------|--------|----------|----------|----------|
| `picture_matching` 图片配对 | 3 | 2 | 1 | 1 |
| `letter_match` 字母消消乐 | 3 | 2 | 2 | 1 |
| `word_spelling` 单词拼写 | 2 | 2 | 2 | 2 |
| `fill_blank` 填空题 | 1 | 2 | 3 | 3 |
| `crossword` 填字游戏 | 1 | 2 | 2 | 3 |
| **合计** | **10** | **10** | **10** | **10** |

> 图片配对和字母消消乐视觉辅助强，适合新手；填空和填字对词义理解和拼写记忆要求更高，适合高级别用户。

#### 例句难度配置

每个单词配置两套例句，存在单词数据文件中：

```typescript
// src/data/words/chapter1.ts
interface WordConfig {
  word: string;           // 单词
  meaning: string;        // 中文释义
  pos: string;            // 词性（n./v./adj.）
  image: string;          // 配图路径
  sentences: {
    basic: {              // 初级例句（纯新手 + 略知一二）
      en: string;         // 简单句型，常见词汇，空白位置明显
      zh: string;         // 中文翻译
    };
    advanced: {           // 高级例句（勉强应付 + 还不错哦）
      en: string;         // 复杂句型，干扰项多，语境更丰富
      zh: string;         // 中文翻译
    };
  };
}

// 示例：
export const chapter2Words: WordConfig[] = [
  {
    word: 'sofa',
    meaning: '沙发',
    pos: 'n.',
    image: '/assets/words/sofa.png',
    sentences: {
      basic: {
        en: 'I sit on the ___.',
        zh: '我坐在沙发上。',
      },
      advanced: {
        en: 'She fell asleep on the comfortable ___ after a long day.',
        zh: '漫长的一天后，她在舒适的沙发上睡着了。',
      },
    },
  },
  // ...
];
```

#### 干扰项难度配置

填空题和填字游戏的干扰项（错误选项）也随难度调整：

| 级别 | 干扰项策略 |
|------|-----------|
| 纯新手 | 干扰项与正确答案差异大（如 sofa vs tree），容易排除 |
| 略知一二 | 干扰项与正确答案同类别（如 sofa vs chair vs desk） |
| 勉强应付 | 干扰项拼写相近（如 sofa vs sofe vs sopa） |
| 还不错哦 | 干扰项语义相近且拼写规范（如 sofa vs couch vs bench） |

#### 难度级别与例句的对应关系

```typescript
// 根据 gameState.difficulty 选择例句版本
function getSentence(word: WordConfig, difficulty: 1 | 2 | 3 | 4) {
  return difficulty <= 2
    ? word.sentences.basic      // 纯新手 + 略知一二用初级例句
    : word.sentences.advanced;  // 勉强应付 + 还不错哦用高级例句
}
```

> 用户可在个人主页随时调整难度级别，下一关即时生效，已完成进度不受影响。

---

## 13. 范围外（MVP 不包含）

| 功能 | 说明 | 规划版本 |
|------|------|----------|
| 用户账号 / 登录 | 基于 sessionId 本地存储 | v2 |
| 云端进度同步 | 换设备数据丢失，接受此约束 | v2 |
| 好友 / 排行榜 / 聊天 | 社交功能延后 | v2 |
| 应用内购或订阅 | 变现方案待确认 | v3 |
| 听力 / 口语 / 发音 | 需独立 ASR，不同方向 | 独立产品线 |
| 国际化 i18n | 当前仅中文界面 + 英文单词 | 待定 |

---

*WordPet PRD v1.3 · 2026-03-16 · Cursor / Claude Code + Paper vibe coding 版*

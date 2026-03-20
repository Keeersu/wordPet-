# WordPet 样式规范 (Style Guide)

> **目标**：所有视觉样式集中在独立 CSS 文件中，TSX 文件只写结构和逻辑，便于 Paper Design 直接修改视觉 UI。

---

## 1. 文件结构

```
frontend/src/styles/
├── tokens.css        # 设计令牌（唯一颜色/字体/间距来源）
├── components.css    # 公共组件（卡片、按钮、导航、弹窗）
├── home.css          # 首页
├── game.css          # 答题页
├── practice.css      # 复习中心
├── collection.css    # 单词图鉴
├── result.css        # 结算页 + 家具解锁动画
├── profile.css       # 学习中心
├── settings.css      # 设置页
└── index.css         # 入口（按顺序 import 上述文件）
```

## 2. 核心规则

### 2.1 禁止在 TSX 中使用内联 style

```tsx
// ❌ 禁止
<div style={{ backgroundColor: '#FFB840', borderRadius: 16 }}>

// ✅ 正确
<div className="card card--padded">
```

### 2.2 所有颜色必须使用 CSS 变量

```css
/* ❌ 禁止 */
color: #5D4037;
background-color: rgba(93, 64, 55, 0.1);

/* ✅ 正确 */
color: var(--color-text);
background-color: var(--color-border);
```

### 2.3 间距、圆角、阴影使用令牌变量

```css
/* ❌ 禁止 */
padding: 16px;
border-radius: 14px;
box-shadow: 0 4px 0 0 rgba(93,64,55,0.08);

/* ✅ 正确 */
padding: var(--space-3xl);
border-radius: var(--radius-2xl);
box-shadow: var(--shadow-card);
```

### 2.4 字体始终使用 `var(--font-main)`

```css
font-family: var(--font-main);
```

### 2.5 按钮按压效果使用 CSS `:active` 伪类

```css
/* ❌ 禁止 — 不要用 onPointerDown/Up/Leave 模拟按压 */
onPointerDown={(e) => { e.currentTarget.style.transform = 'translateY(3px)' }}

/* ✅ 正确 — 使用 CSS :active */
.btn-primary:active {
  transform: translateY(3px);
  box-shadow: 0 0px 0 0 var(--color-primary-dark);
}
```

## 3. CSS 命名规范

### 3.1 BEM-like 命名

```
.组件名                    →  .card
.组件名--修饰符            →  .card--padded
.组件名__子元素            →  .card__title
.组件名__子元素--修饰符    →  .card__title--sm
```

### 3.2 页面前缀

| 页面 | 前缀 |
|------|------|
| 首页 | `home-` |
| 答题 | `game-` |
| 复习 | `practice-` |
| 图鉴 | `collection-` |
| 结算 | `result-` |
| 个人 | `profile-` |
| 设置 | `settings-` |

### 3.3 公共组件不加页面前缀

```css
.card               /* 通用卡片 */
.btn-primary        /* 主按钮 */
.back-btn           /* 返回按钮 */
.page-header        /* 页面头部 */
.toggle             /* 开关 */
.progress-bar       /* 进度条 */
.rate-badge         /* 正确率色标 */
```

## 4. 设计令牌速查

### 颜色

| 变量 | 值 | 用途 |
|------|-----|------|
| `--color-primary` | `#FFB840` | 主题金色 |
| `--color-text` | `#5D4037` | 主文字 |
| `--color-success` | `#66BB6A` | 正确/成功 |
| `--color-error` | `#EF5350` | 错误/失败 |
| `--color-bg-warm` | `#FFF8E7` | 大多数页面背景 |
| `--color-bg-game` | `#F5E6C8` | 答题页背景 |
| `--color-bg-card` | `#FFFFFF` | 卡片白色 |

### 间距

| 变量 | 值 |
|------|----|
| `--space-xs` | 4px |
| `--space-sm` | 6px |
| `--space-md` | 8px |
| `--space-lg` | 10px |
| `--space-xl` | 12px |
| `--space-2xl` | 14px |
| `--space-3xl` | 16px |
| `--space-4xl` | 20px |
| `--space-5xl` | 24px |

### 圆角

| 变量 | 值 | 用途 |
|------|----|------|
| `--radius-md` | 8px | 小标签 |
| `--radius-lg` | 10px | 按钮 |
| `--radius-xl` | 12px | 选项按钮 |
| `--radius-2xl` | 14px | 大按钮 |
| `--radius-3xl` | 16px | 卡片 |
| `--radius-full` | 9999px | 胶囊形 |

### 阴影

| 变量 | 用途 |
|------|------|
| `--shadow-card` | 卡片底部厚投影 |
| `--shadow-button-primary` | 金色按钮投影 |
| `--shadow-nav` | 导航按钮小投影 |
| `--shadow-modal` | 弹窗大投影 |

## 5. 新增页面/组件流程

1. 在 `styles/` 下创建对应 CSS 文件（如 `newpage.css`）
2. 在 `index.css` 中按顺序添加 `@import "./newpage.css";`
3. 所有颜色/间距/圆角/阴影引用 `tokens.css` 变量
4. 优先复用 `components.css` 中的公共类
5. 页面特有样式使用 `newpage-` 前缀

## 6. 与 Paper Design 协作

- **Paper Design 直接修改 CSS 文件**即可调整视觉风格
- 修改 `tokens.css` 可全局调整主题色、字体、间距
- 修改各页面 CSS 可精细调整具体组件样式
- **无需接触 TSX 文件**（除非需要修改结构/逻辑）

## 7. 仍需使用内联 style 的例外情况

以下场景允许使用内联 style（因为值是动态计算的）：

- **动态颜色**：如正确率色标 `style={{ color: rateColor(rate) }}`
- **动态宽度**：如进度条 `style={{ width: \`\${progress}%\` }}`
- **动态动画参数**：如粒子效果的随机位置/角度
- **条件 background**：如根据数据状态切换渐变

其他所有**固定样式**必须写入 CSS 文件。

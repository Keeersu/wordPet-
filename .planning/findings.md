# WordPet - 研究发现与技术决策

## 项目架构分析

### 实际技术架构（Paraflow）
- **前端**：React 19 + Vite + Tailwind CSS + Jotai + React Router
- **后端**：Hono + Drizzle ORM + PostgreSQL + Cloudflare Workers
- **测试**：Vitest + PGLite（内存数据库）
- **包管理**：pnpm monorepo（frontend / backend / bdd-test）

### PRD 期望架构（TECH_SPEC.md）
- **前端**：React 18 + Vite + 独立CSS文件 + React Context + HashRouter
- **后端**：无后端，纯前端 localStorage
- **禁止**：Redux、MobX、Styled-components、Tailwind、UI 组件库

### 关键差异
| 项目 | PRD 期望 | 实际 Paraflow | 影响 |
|------|---------|---------------|------|
| 路由 | HashRouter | BrowserRouter | 部署兼容性不同 |
| 状态 | Context + localStorage | Jotai + Store 模式 | 需要适配 |
| 样式 | 独立 CSS + CSS 变量 | Tailwind | 样式组织方式不同 |
| 数据 | localStorage | PostgreSQL + localStorage 混用 | 需决策 |

### 建议决策
鉴于项目已在 Paraflow 上运行，建议：
1. **继续使用 Paraflow 架构**，不回退到 PRD 的技术选型
2. **gameState 仍用 localStorage**（符合 PRD 的纯前端存储需求）
3. **样式可以混用 Tailwind + 独立 CSS**（核心视觉组件用独立 CSS 方便设计师调参）
4. **后端暂不使用**（MVP 阶段不需要数据库）

## 已完成页面的实现质量

### Home.tsx（~585行）
- 完整的房间卡片列表
- 进度状态展示
- 底部导航栏

### Game.tsx（~1035行）
- 最复杂的页面，包含多种题型
- 答题交互、反馈弹窗
- 自适应难度逻辑

### Result.tsx（~359行）
- 答题统计展示
- 家具解锁逻辑

### Room.tsx（~703行）
- 房间全景渲染
- 家具/猫咪展示
- 关卡进度

## 关键文件位置
- **PRD 文档**：`/workspace/snu18js3xdld/WordPet_PRD_v1.3_delivery.md`
- **技术规范**：`/workspace/snu18js3xdld/TECH_SPEC.md`
- **前端页面**：`/workspace/snu18js3xdld/frontend/src/pages/function/`
- **路由配置**：`/workspace/snu18js3xdld/frontend/src/routes.ts`
- **路径管理**：`/workspace/snu18js3xdld/frontend/src/pageLinks.ts`
- **Canvas 设计**：`/workspace/snu18js3xdld/canvas/`

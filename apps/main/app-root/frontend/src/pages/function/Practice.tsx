/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 提供多种题型的词汇练习和复习测试，巩固学习成果。
 * Style referenceFiles:
 * Design for: Mobile
 * </base-info>
 * <page-design>
 * ## Features & Interactions
 * - 选择不同的练习模式（测验、拼写、闪卡）
 * - 查看今日待复习任务
 * - 导航：首页 (Tab)、图鉴 (Tab)、我的 (Tab)
 * 
 * ## Basic Layout
 * Tab-based: Header + Main + Tab Bar
 * 
 * ## Reuse Components
 * - `MainTabBar`
 * 
 * ## Page Layout
 * `h-screen flex flex-col`
 * 
 * **Header**: nav-bar - 居中标题 "练习"
 * 
 * **Main** `flex-1 overflow-y-auto px-4 py-4 space-y-6`:
 * 1. **今日任务** (hero card): 
 *    - 布局: Overlay / Padded
 *    - 内容: 标题 "今日待复习" + 巨大数字 "24" 词 + "开始复习" 主按钮
 * 2. **练习模式** (quick-actions): grid-2col
 *    - 卡片: 包含图标、模式名称（如：趣味拼写）、描述说明
 * 3. **学习记录** (list): 
 *    - 标题: "最近练习"
 *    - 列表项: 练习类型名称 + 正确率 + 时间标签
 * 
 * **Bottom**: Reuse `MainTabBar`, activeKey="practice"
 * 
 * ## Mock Data
 * 今日任务：24词待复习。
 * 模式：趣味拼写、闪卡记忆、听音辨词、看图选词。
 * 记录：听音辨词 (正确率 90%, 昨天)、趣味拼写 (正确率 85%, 2天前)。
 * 
 * ## Reference
 * - site-map.md
 * </page-design>
 */

import { PagePlaceholder } from '@/components/function/base/PagePlaceholder'

function Practice() {
  return <PagePlaceholder title="Practice" />
}

export default Practice

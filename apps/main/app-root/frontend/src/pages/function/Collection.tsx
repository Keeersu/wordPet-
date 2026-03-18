/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 已学单词的图鉴画廊，按房间/主题分类展示用户的收集进度。
 * Style referenceFiles:
 * Design for: Mobile
 * </base-info>
 * <page-design>
 * ## Features & Interactions
 * - 按房间主题筛选已学单词
 * - 查看单词释义、发音及关联的猫猫插画
 * - 导航：首页 (Tab)、练习 (Tab)、我的 (Tab)
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
 * **Header**: nav-bar - 居中标题 "图鉴"，右侧搜索图标
 * 
 * **Main** `flex-1 flex flex-col overflow-hidden`:
 * 1. **主题切换**: horizontal-scroll `segment-tabs` (房间列表：街角、小屋等)
 * 2. **统计栏**: stats-row `px-4 py-2` - 收集总数 / 掌握度
 * 3. **图鉴网格** `flex-1 overflow-y-auto px-4`: grid-3col
 *    - 卡片类型: Vertical No-container
 *    - 内容: 单词插画 (正方形) + 英文单词主体 + 中文小字
 * 
 * **Bottom**: Reuse `MainTabBar`, activeKey="collection"
 * 
 * ## Mock Data
 * 分类：全部、街角流浪、温馨小屋。
 * 统计：已收集 42/150 词。
 * 单词卡片：apple, tree, bench, cat, bowl (带有解锁和未解锁的剪影状态)。
 * 
 * ## Reference
 * - site-map.md
 * </page-design>
 */

import { PagePlaceholder } from '@/components/function/base/PagePlaceholder'

function Collection() {
  return <PagePlaceholder title="Collection" />
}

export default Collection

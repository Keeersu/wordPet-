/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 展示用户个人信息、猫猫状态以及整体学习成就统计。
 * Style referenceFiles:
 * Design for: Mobile
 * </base-info>
 * <page-design>
 * ## Features & Interactions
 * - 查看个人成就和学习数据统计
 * - 编辑资料入口
 * - 导航：设置 (push /settings)、首页 (Tab)
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
 * **Header**: profile-header
 * - 布局: 居中头像/猫猫展示 + 用户名 + 编辑按钮
 * - 右上角：设置图标 (导航至 /settings)
 * 
 * **Main** `flex-1 overflow-y-auto px-4 py-4 space-y-6`:
 * 1. **数据面板** (stats-row): grid-3col 
 *    - 学习天数、累计单词、猫猫等级
 * 2. **成就徽章** (horizontal-scroll):
 *    - 标题 "我的成就"
 *    - 横向列表: 徽章图标 + 徽章名称
 * 3. **学习热力图/图表** (card):
 *    - 柱状图展示近7天学习词数
 * 4. **功能列表** (list): divide-y
 *    - 学习历史、猫猫换装（锁定）、反馈帮助
 * 
 * **Bottom**: Reuse `MainTabBar`, activeKey="profile"
 * 
 * ## Mock Data
 * 用户：冒险家小明。猫猫：Lv.3。
 * 数据：12 天连续学习，150 词汇量。
 * 图表：近7天每天 10-25 个单词波动。
 * 
 * ## Reference
 * - site-map.md
 * </page-design>
 */

import { PagePlaceholder } from '@/components/function/base/PagePlaceholder'

function Profile() {
  return <PagePlaceholder title="Profile" />
}

export default Profile

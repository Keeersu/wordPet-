/**
 * @deprecated 已迁移至 CSS 设计令牌系统
 *
 * CARD_STYLE  -> .card (src/styles/components.css)
 * FONT_FAMILY -> --font-main (src/styles/tokens.css)
 *
 * 此文件保留以防遗漏引用，后续可安全删除。
 */

import type React from 'react'

/** @deprecated 使用 className="card" 代替 */
export const CARD_STYLE: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: 16,
  border: '2px solid rgba(93,64,55,0.1)',
  boxShadow: '0 4px 0 0 rgba(93,64,55,0.08)',
}

/** @deprecated 使用 CSS var(--font-main) 代替 */
export const FONT_FAMILY = "'Nunito', 'PingFang SC', sans-serif"

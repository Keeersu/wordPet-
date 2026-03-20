/**
 * 公共样式常量
 * 消除 Practice / Collection 等页面中重复的卡片样式定义
 */

import type React from 'react'

/** 通用白色卡片样式（圆角 16 + 细边框 + 浅投影） */
export const CARD_STYLE: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: 16,
  border: '2px solid rgba(93,64,55,0.1)',
  boxShadow: '0 4px 0 0 rgba(93,64,55,0.08)',
}

/** 通用字体栈 */
export const FONT_FAMILY = "'Nunito', 'PingFang SC', sans-serif"

/**
 * 公共颜色工具函数
 * 统一管理正确率色标逻辑，消除 Practice / Collection / Result 中的重复实现
 */

/** 根据正确率返回对应的前景色 */
export function rateColor(rate: number): string {
  if (rate >= 80) return '#66BB6A'
  if (rate >= 60) return '#FFB840'
  return '#EF5350'
}

/** 根据正确率返回对应的浅背景色 */
export function rateBgColor(rate: number): string {
  if (rate >= 80) return 'rgba(102,187,106,0.12)'
  if (rate >= 60) return 'rgba(255,184,64,0.12)'
  return 'rgba(239,83,80,0.12)'
}

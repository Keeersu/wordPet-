/**
 * 章节元数据 — 统一数据源
 *
 * 所有需要章节信息（中/英名称、emoji、主题色）的地方都应该从这里导入，
 * 消除 Home / Game / Practice / Collection 中各自维护的重复映射。
 */

export interface ChapterMeta {
  id: number
  nameCn: string
  nameEn: string
  emoji: string
  themeColor: string
}

/** 章节列表（顺序与关卡编号一一对应） */
export const CHAPTERS: ChapterMeta[] = [
  { id: 1, nameCn: '流浪街角', nameEn: 'Street Corner',    emoji: '🏙️', themeColor: '#F5E6C8' },
  { id: 2, nameCn: '温馨小家', nameEn: 'Cozy Home',        emoji: '🏠', themeColor: '#C8E8F5' },
  { id: 3, nameCn: '厨房冒险', nameEn: 'Kitchen Adventure', emoji: '🍳', themeColor: '#FFF0D9' },
  { id: 4, nameCn: '趣味乐园', nameEn: 'Fun Playground',   emoji: '🎠', themeColor: '#D8F0FF' },
  { id: 5, nameCn: '阳光书房', nameEn: 'Sunny Study',      emoji: '📖', themeColor: '#E5F4D8' },
]

/** 按 id 快速索引 */
export const CHAPTER_MAP: Record<number, ChapterMeta> = Object.fromEntries(
  CHAPTERS.map((ch) => [ch.id, ch]),
)

/** 获取章节中文名（兼容旧代码 fallback） */
export function getChapterName(chapterId: number): string {
  return CHAPTER_MAP[chapterId]?.nameCn ?? `第${chapterId}章`
}

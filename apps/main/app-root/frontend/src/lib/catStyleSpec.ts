/**
 * 猫咪画风统一规范 & 房间动作/位置配置
 *
 * 画风锚定：扁平矢量可爱猫插画（flat vector kawaii cat）
 * 参考图特征提取：
 *   - 扁平矢量填充，无渐变，纯色色块
 *   - 极简干净轮廓线，无复杂细节
 *   - 圆润胖乎乎的身体比例（2头身）
 *   - 粉色内耳、粉色肉垫（pink inner ears, pink paw pads）
 *   - 粉色腮红圆点（pink blush circles on cheeks）
 *   - 简单面部：圆点眼睛、小倒三角鼻、细胡须线
 *   - 柔和粉彩配色（soft pastel palette）
 *
 * 生成流程：
 *   1. onboarding 时生成「基本形象照」—— 1:1 方形正面头像/半身像
 *   2. 进入每个房间时按需生成「房间动作图」—— 全身不同姿态
 */

import type { CSSProperties } from 'react'

// ─── 风格参考图 URL ──────────────────────────────────────────────────────
// 如果你将参考图上传到了 CDN，填入 URL 后生成时会自动作为 image_urls 传入 API。
// 留空数组则不使用参考图（仅靠 prompt 控制画风）。
export const PORTRAIT_REFERENCE_URLS: string[] = [
  'https://conan-online.fbcontent.cn/conan-oss-resource/h8f7mlbsf.jpg',
  'https://conan-online.fbcontent.cn/conan-oss-resource/d8gtls8lq.jpg',
  'https://conan-online.fbcontent.cn/conan-oss-resource/d3a2z97uf.jpg',
  'https://conan-online.fbcontent.cn/conan-oss-resource/vk9eh8xyh.jpg',
  'https://conan-online.fbcontent.cn/conan-oss-resource/ue619doy4.jpg',
  'https://conan-online.fbcontent.cn/conan-oss-resource/9h5bcsz43.jpg',
  'https://conan-online.fbcontent.cn/conan-oss-resource/7clz58qkk.jpg',
  'https://conan-online.fbcontent.cn/conan-oss-resource/mw64kox1q.jpg',
  'https://conan-online.fbcontent.cn/conan-oss-resource/kzldeadmj.jpg',
]

export const FULLBODY_REFERENCE_URLS: string[] = [
  'https://conan-online.fbcontent.cn/conan-oss-resource/rczyu2aaf.jpg',
  'https://conan-online.fbcontent.cn/conan-oss-resource/43iumwp0p.jpg',
  'https://conan-online.fbcontent.cn/conan-oss-resource/msxpjiee2.jpg',
  'https://conan-online.fbcontent.cn/conan-oss-resource/ss291a7uz.jpg',
  'https://conan-online.fbcontent.cn/conan-oss-resource/nk09gki6q.jpg',
  'https://conan-online.fbcontent.cn/conan-oss-resource/ku0tmkx4m.jpg',
  'https://conan-online.fbcontent.cn/conan-oss-resource/dd9ckjnyg.jpg',
  'https://conan-online.fbcontent.cn/conan-oss-resource/jfg4r4v3i.jpg',
  'https://conan-online.fbcontent.cn/conan-oss-resource/8az9fl810.jpg',
  'https://conan-online.fbcontent.cn/conan-oss-resource/3t1b570kt.jpg',
  'https://conan-online.fbcontent.cn/conan-oss-resource/mtz2csx26.jpg',
  'https://conan-online.fbcontent.cn/conan-oss-resource/zribhzz4m.jpg',
]

// ─── 房间动作 & 位置配置 ──────────────────────────────────────────────────
export interface RoomCatPose {
  chapterId: number
  nameCn: string
  /** 该房间下猫咪的动作/姿势描述词 */
  actionPrompt: string[]
  /** 猫咪在房间背景中的 CSS 定位 */
  position: { bottom: string; left?: string; right?: string }
  /** 猫咪在房间背景中的尺寸 */
  size: { width: string; height: string }
}

export const ROOM_CAT_POSES: Record<number, RoomCatPose> = {
  1: {
    chapterId: 1,
    nameCn: '街角流浪',
    actionPrompt: [
      '蜷缩坐姿，尾巴环绕身体',
      '仰头看，大大的充满期待的圆眼睛',
      '微微歪头，耳朵竖起',
    ],
    position: { bottom: '6%', left: '8%' },
    size: { width: '90px', height: '90px' },
  },
  2: {
    chapterId: 2,
    nameCn: '温暖新家',
    actionPrompt: [
      '侧躺趴卧，放松的睡姿',
      '闭眼微笑，脸颊泛红',
      '前爪缩在下巴下面，尾巴卷曲',
    ],
    position: { bottom: '10%', left: '30%' },
    size: { width: '120px', height: '85px' },
  },
  3: {
    chapterId: 3,
    nameCn: '幼儿园',
    actionPrompt: [
      '端坐姿势，一只前爪举高打招呼',
      '睁大眼睛，好奇兴奋的表情',
      '耳朵竖直，注意力集中',
    ],
    position: { bottom: '10%', left: '20%' },
    size: { width: '95px', height: '105px' },
  },
  4: {
    chapterId: 4,
    nameCn: '公园探险',
    actionPrompt: [
      '扑跳姿势，前身压低，屁股和尾巴翘高',
      '开心大笑，舌头微微伸出',
      '四肢伸展，动感十足',
    ],
    position: { bottom: '12%', right: '15%' },
    size: { width: '110px', height: '95px' },
  },
  5: {
    chapterId: 5,
    nameCn: '厨房美食',
    actionPrompt: [
      '后腿站立，前爪向上伸',
      '闭眼陶醉地嗅闻，开心流口水的表情',
      '尾巴摇摆，踮脚姿势',
    ],
    position: { bottom: '8%', right: '10%' },
    size: { width: '90px', height: '115px' },
  },
}

/**
 * 获取指定房间的猫咪定位样式（供 Room 组件内联 style 使用）
 */
export function getRoomCatStyle(chapterId: number): CSSProperties {
  const pose = ROOM_CAT_POSES[chapterId]
  if (!pose) {
    return { bottom: '8%', left: '10%', width: '100px', height: '100px' }
  }
  return {
    bottom: pose.position.bottom,
    ...(pose.position.left != null ? { left: pose.position.left } : {}),
    ...(pose.position.right != null ? { right: pose.position.right } : {}),
    width: pose.size.width,
    height: pose.size.height,
  }
}

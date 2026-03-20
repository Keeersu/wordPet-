/**
 * 鼓励文案库 + 随机选取工具
 */

export const ENCOURAGE_CORRECT = [
  '完美！',
  '太棒了！',
  '就是这样！',
  '答对啦！',
  '真厉害！',
]

export const ENCOURAGE_WRONG = [
  '没关系，继续加油！',
  '差一点～再来！',
  '记住了，下次一定会！',
  '别灰心，你可以的！',
]

export function getRandomEncourage(isCorrect: boolean): string {
  const list = isCorrect ? ENCOURAGE_CORRECT : ENCOURAGE_WRONG
  return list[Math.floor(Math.random() * list.length)]
}

export function randomInRange(
  min: number,
  max: number,
  integer = false,
): number {
  if (min > max) {
    [min, max] = [max, min]
  }

  const value = Math.random() * (max - min) + min
  return integer ? Math.floor(value) : value
}

export function getHumanTypingDelay(index: number, text: string) {
  const char = text[index]

  // ===== 1. 基础速度 =====
  let delay = randomInRange(16, 100)

  // ===== 2. 索引相关：开头慢，中段快，结尾慢 =====
  const progress = index / text.length

  if (progress < 0.15) {
    delay *= 1.3 // 起手慢
  }
  else if (progress > 0.85) {
    delay *= 1.25 // 收尾慢
  }

  // ===== 3. 字符类型权重 =====
  if (char === ' ') {
    delay += 16
  }

  if (/[,.!?;:]/.test(char)) {
    delay += randomInRange(16, 50)
  }

  // ===== 4. 小概率“走神”停顿 =====
  if (Math.random() < 0.03) {
    delay += randomInRange(100, 200)
  }

  // ===== 5. 下限保护 =====
  return Math.max(40, Math.round(delay))
}

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

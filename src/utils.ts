export function getHumanTypingDelay(index: number, text: string) {
  const char = text[index]

  // ===== 1. 基础速度（约 90–150 ms）=====
  let delay = 90 + Math.random() * 60

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
    delay += 40
  }

  if (/[,.!?;:]/.test(char)) {
    delay += 200 + Math.random() * 150
  }

  // ===== 4. 小概率“走神”停顿 =====
  if (Math.random() < 0.03) {
    delay += 300 + Math.random() * 500
  }

  // ===== 5. 下限保护 =====
  return Math.max(40, Math.round(delay))
}

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

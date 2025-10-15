export type LevelInfo = {
  code: number
  nameKo: string
  nameEn: string
  tagline: string
  icons: string
  minExp: number
}

export const levels: Record<number, LevelInfo> = {
  1: { code: 1, nameKo: "씨앗", nameEn: "Seed", tagline: "금융의 시작", icons: "🌰🧭", minExp: 0 },
  2: { code: 2, nameKo: "새싹", nameEn: "Sprout", tagline: "첫 성장 단계", icons: "🌱🧭", minExp: 300 },
  3: { code: 3, nameKo: "나무", nameEn: "Tree", tagline: "기반이 잡힌 단계", icons: "🌿🧭", minExp: 900 },
  4: { code: 4, nameKo: "열매", nameEn: "Fruit", tagline: "성과를 맺는 단계", icons: "🍏🧭", minExp: 1800 },
  5: { code: 5, nameKo: "거목", nameEn: "Great", tagline: "최고의 명예 단계", icons: "🌳🧭", minExp: 3000 },
}

export function getLevelProgress(totalExp: number, level: number): {
  current: number
  nextMin: number | null
  percent: number
} {
  const current = levels[level] ?? levels[1]
  const next = levels[level + 1] ?? null
  if (!next) return { current: current.minExp, nextMin: null, percent: 100 }
  const numerator = Math.max(0, totalExp - current.minExp)
  const denominator = Math.max(1, next.minExp - current.minExp)
  return { current: current.minExp, nextMin: next.minExp, percent: Math.min(100, (numerator / denominator) * 100) }
}


// 레벨별 모의 투자 재충전 가능 금액(원)
export function getInvestmentRechargeAmount(level: number): number {
  switch (level) {
    case 2:
      return 50000
    case 3:
      return 100000
    case 4:
      return 300000
    case 5:
      return 500000
    default:
      return 0
  }
}



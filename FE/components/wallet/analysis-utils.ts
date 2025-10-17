import { 
  TrendingUp, 
  DollarSign,
  ShoppingCart,
  Utensils,
  Car,
  Gamepad2,
  PiggyBank,
  BadgeCheck,
  Info
} from "lucide-react"

// 상수 정의
const CONSUMPTION_THRESHOLDS = {
  SAVER_DAILY_EXPENSE: 10000,
  SAVER_DAILY_FREQUENCY: 1.5,
  IMPULSE_AVG_TRANSACTION: 30000,
  IMPULSE_DAILY_FREQUENCY: 3,
  PLANNER_DAILY_EXPENSE: 25000,
  PLANNER_AVG_TRANSACTION: 25000,
  SIGNIFICANT_CHANGE_THRESHOLD: 10
} as const

const TIME_CONSTANTS = {
  MILLISECONDS_PER_DAY: 1000 * 60 * 60 * 24,
  DAYS_PER_WEEK: 7
} as const

export interface Transaction {
  id: number
  title: string
  category: string
  amount: number
  transactionDate: string
  description: string
  memo?: string
  relatedAccountNumber?: string
  type: string
  createdAt: string
}

// 타입 정의 개선
export type PeriodType = 'week' | 'thisMonth' | 'lastMonth' | 'custom'
export type ConsumptionType = 'none' | 'saver' | 'impulse' | 'planner' | 'trendy'
export type LucideIcon = typeof PiggyBank

export const categoryIcons: Record<string, LucideIcon> = {
  용돈: PiggyBank,
  송금: DollarSign,
  입금: TrendingUp,
  이체: DollarSign,
  스토어: ShoppingCart,
  교통: Car,
  문화: Gamepad2,
  쇼핑: ShoppingCart,
  음식: Utensils,
  저축: PiggyBank,
  기타: Info,
}

// 도넛 차트용 색상 배열 정의 
export const donutColors = [
  '#FF6B6B', // 코랄 레드
  '#4ECDC4', // 터콰이즈
  '#45B7D1', // 스카이 블루
  '#96CEB4', // 민트 그린
  '#FFEAA7', // 소프트 옐로우
  '#DDA0DD', // 플럼
  '#98D8C8', // 아쿠아 그린
  '#F7DC6F', // 골든 옐로우
  '#BB8FCE', // 라벤더
  '#85C1E9'  // 라이트 블루
]

export interface CategoryAnalysisItem {
  category: string
  amount: number
  percentage: number
  icon: LucideIcon
  color: string
}

export interface MonthlyComparison {
  currentMonth: number
  previousMonth: number
  difference: number
  percentageChange: number
  isIncrease: boolean
  isSignificant: boolean
}

export interface ConsumptionTypeData {
  type: ConsumptionType
  title: string
  description: string
  icon: LucideIcon
  color: string
  tip: string[]
}

export interface MonthlyAnalysisItem {
  month: string
  year: number
  monthNumber: number
  amount: number
  isCurrentMonth: boolean
  isSelected: boolean
}

/**
 * 기간별로 거래 내역을 필터링합니다.
 * @param transactions - 전체 거래 내역 배열
 * @param selectedPeriod - 선택된 기간 ('week', 'thisMonth', 'lastMonth', 'custom')
 * @param selectedCustomMonth - 커스텀 기간 선택 시 사용할 월 (YYYY-MM 형식)
 * @returns 필터링된 거래 내역 배열
 */
export const getFilteredTransactions = (
  transactions: Transaction[], 
  selectedPeriod: PeriodType,
  selectedCustomMonth: string
): Transaction[] => {
  if (!transactions || transactions.length === 0) {
    return []
  }

  const now = new Date()
  let startDate: Date
  let endDate: Date
  
  try {
    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now.getTime() - TIME_CONSTANTS.DAYS_PER_WEEK * TIME_CONSTANTS.MILLISECONDS_PER_DAY)
        endDate = now
        break
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = now
        break
      case 'lastMonth':
        startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0))
        endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999))
        break
      case 'custom':
        if (selectedCustomMonth && selectedCustomMonth.includes('-')) {
          const [year, month] = selectedCustomMonth.split('-').map(Number)
          if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            throw new Error('Invalid custom month format')
          }
          startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
          endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          endDate = now
        }
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = now
    }
    
    return transactions.filter(tx => {
      if (!tx.transactionDate) return false
      const txDate = new Date(tx.transactionDate)
      return !isNaN(txDate.getTime()) && txDate >= startDate && txDate <= endDate
    })
  } catch (error) {
    console.error('Error filtering transactions:', error)
    return []
  }
}

/**
 * 전월 대비 지출 변화를 분석합니다.
 * @param transactions - 전체 거래 내역 배열
 * @param selectedPeriod - 선택된 기간
 * @param selectedCustomMonth - 커스텀 기간 선택 시 사용할 월
 * @returns 월별 비교 데이터 또는 null (비교 불가능한 경우)
 */
export const getMonthlyComparison = (
  transactions: Transaction[],
  selectedPeriod: PeriodType,
  selectedCustomMonth: string
): MonthlyComparison | null => {
  if (!transactions || transactions.length === 0) {
    return null
  }

  if (selectedPeriod !== 'thisMonth' && selectedPeriod !== 'lastMonth' && selectedPeriod !== 'custom') {
    return null
  }

  const now = new Date()
  let currentMonthStart: Date, currentMonthEnd: Date
  let previousMonthStart: Date, previousMonthEnd: Date

  if (selectedPeriod === 'thisMonth') {
    currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    currentMonthEnd = now
    previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  } else if (selectedPeriod === 'lastMonth') {
    currentMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    currentMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    previousMonthEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0)
  } else if (selectedPeriod === 'custom' && selectedCustomMonth) {
    const [year, month] = selectedCustomMonth.split('-').map(Number)
    currentMonthStart = new Date(year, month - 1, 1)
    currentMonthEnd = new Date(year, month, 0)
    previousMonthStart = new Date(year, month - 2, 1)
    previousMonthEnd = new Date(year, month - 1, 0)
  } else {
    return null
  }

  // 현재 월 지출 계산
  const currentMonthExpenses = transactions
    .filter(tx => {
      if (!tx.transactionDate || tx.amount >= 0) return false
      const txDate = new Date(tx.transactionDate)
      return !isNaN(txDate.getTime()) && txDate >= currentMonthStart && txDate <= currentMonthEnd
    })
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

  // 전월 지출 계산
  const previousMonthExpenses = transactions
    .filter(tx => {
      if (!tx.transactionDate || tx.amount >= 0) return false
      const txDate = new Date(tx.transactionDate)
      return !isNaN(txDate.getTime()) && txDate >= previousMonthStart && txDate <= previousMonthEnd
    })
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

  const difference = currentMonthExpenses - previousMonthExpenses
  const percentageChange = previousMonthExpenses > 0 ? (difference / previousMonthExpenses) * 100 : 0

  return {
    currentMonth: currentMonthExpenses,
    previousMonth: previousMonthExpenses,
    difference,
    percentageChange,
    isIncrease: difference > 0,
    isSignificant: Math.abs(percentageChange) > CONSUMPTION_THRESHOLDS.SIGNIFICANT_CHANGE_THRESHOLD
  }
}

/**
 * 카테고리별 지출 분석을 수행합니다.
 * @param filteredTransactions - 필터링된 거래 내역 배열
 * @returns 카테고리별 분석 결과 배열 (금액 순으로 정렬됨)
 */
export const getCategoryAnalysis = (filteredTransactions: Transaction[]): CategoryAnalysisItem[] => {
  const expenses = filteredTransactions.filter(tx => tx.amount < 0)
  
  if (expenses.length === 0) return []
  
  const categoryTotals: Record<string, number> = {}
  
  // 단일 루프로 카테고리별 합계와 총합을 동시에 계산
  let totalExpense = 0
  for (const tx of expenses) {
    const amount = Math.abs(tx.amount)
    categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + amount
    totalExpense += amount
  }
  
  // 백분율을 정확히 100%로 정규화
  const rawPercentages = Object.entries(categoryTotals).map(([category, amount]) => ({
    category,
    amount,
    rawPercentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0
  }))
  
  // 정규화된 백분율 계산 (총합이 정확히 100%가 되도록)
  const totalRawPercentage = rawPercentages.reduce((sum, item) => sum + item.rawPercentage, 0)
  const normalizationFactor = totalRawPercentage > 0 ? 100 / totalRawPercentage : 1
  
  const sortedData = rawPercentages
    .map(({ category, amount, rawPercentage }) => ({
      category,
      amount,
      percentage: rawPercentage * normalizationFactor,
      icon: categoryIcons[category] || Info
    }))
    .sort((a, b) => b.amount - a.amount)
  
  // 정렬 후에 색상 할당하고 백분율을 다시 정규화
  const normalizedData = sortedData.map((item, index) => ({
    ...item,
    color: donutColors[index % donutColors.length]
  }))
  
  // 최종 백분율 정규화 (소수점 반올림으로 인한 오차 보정)
  const finalTotal = normalizedData.reduce((sum, item) => sum + item.percentage, 0)
  if (Math.abs(finalTotal - 100) > 0.01) {
    const finalNormalizationFactor = 100 / finalTotal
    return normalizedData.map(item => ({
      ...item,
      percentage: item.percentage * finalNormalizationFactor
    }))
  }
  
  return normalizedData
}

/**
 * 청소년 맞춤형 소비 유형을 분석합니다.
 * 일일 지출액과 거래 빈도를 기반으로 4가지 소비 패턴을 분류합니다.
 * @param filteredTransactions - 필터링된 거래 내역 배열
 * @returns 소비 유형 분석 결과 (타입, 제목, 설명, 아이콘, 색상, 팁 포함)
 */
export const getConsumptionType = (filteredTransactions: Transaction[]): ConsumptionTypeData => {
  if (!filteredTransactions || filteredTransactions.length === 0) {
    return { 
      type: 'none', 
      title: '소비 내역 없음',
      description: '아직 소비 기록이 없네요! 첫 거래를 시작할 준비가 되었어요!',
      icon: Info,
      color: 'from-gray-400 to-gray-600',
      tip: [
        '용돈이나 알바비로 첫 소비를 시작해보세요!',
        '작은 것부터 시작해서 소비 패턴을 만들어가요!'
      ]
    }
  }

  const expenses = filteredTransactions.filter(tx => tx.amount < 0)
  if (expenses.length === 0) {
    return { 
      type: 'none', 
      title: '소비 내역 없음',
      description: '아직 소비 기록이 없네요! 첫 거래를 시작할 준비가 되었어요!',
      icon: Info,
      color: 'from-gray-400 to-gray-600',
      tip: [
        '용돈이나 알바비로 첫 소비를 시작해보세요!',
        '작은 것부터 시작해서 소비 패턴을 만들어가요!'
      ]
    }
  }

  const totalExpense = expenses.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
  const avgTransaction = totalExpense / expenses.length
  const transactionCount = expenses.length
  
  // 기간 계산 (최소 1일)
  const firstTransactionDate = filteredTransactions[0]?.transactionDate
  if (!firstTransactionDate) {
    return {
      type: 'none',
      title: '데이터 오류',
      description: '앗! 거래 날짜 정보가 없네요. 잠시만요, 데이터를 다시 확인해볼게요!',
      icon: Info,
      color: 'from-gray-400 to-gray-600',
      tip: [
        '거래 내역을 새로고침하거나',
        '잠시 후 다시 시도해보세요!'
      ]
    }
  }
  
  // UTC 기준으로 일수 계산하여 시간대 문제 해결
  const firstDate = new Date(firstTransactionDate)
  const now = new Date()
  const daysDiff = Math.max(1, Math.ceil((now.getTime() - firstDate.getTime()) / TIME_CONSTANTS.MILLISECONDS_PER_DAY))
  const dailyExpense = totalExpense / daysDiff
  
  // 소비 빈도 (일 평균 거래 횟수)
  const dailyTransactionFreq = transactionCount / daysDiff

  // 청소년 맞춤 소비 패턴 분석
  // 1. 절약형: 하루 평균 1만원 이하, 거래 빈도 낮음
  if (dailyExpense <= CONSUMPTION_THRESHOLDS.SAVER_DAILY_EXPENSE && dailyTransactionFreq <= CONSUMPTION_THRESHOLDS.SAVER_DAILY_FREQUENCY) {
    return {
      type: 'saver',
      title: '절약왕',
      description: '필요한 것만 꼼꼼히 구매하고 있어요. 이런 습관이 나중에 큰 자산이 될 거예요!',
      icon: PiggyBank,
      color: 'from-teal-500 to-emerald-600',
      tip: [
        '지금처럼 계획적인 소비를 유지하고, 목돈 모으기에 도전해보세요!'
      ]
    }
  }
  
  // 2. 충동형: 평균 거래금액이 크거나 거래 빈도가 매우 높음
  else if (avgTransaction > CONSUMPTION_THRESHOLDS.IMPULSE_AVG_TRANSACTION || dailyTransactionFreq > CONSUMPTION_THRESHOLDS.IMPULSE_DAILY_FREQUENCY) {
    return {
      type: 'impulse',
      title: '충동소비형',
      description: '조금만 멈춰서 생각해보면 더 좋은 선택을 할 수 있어요!',
      icon: ShoppingCart,
      color: 'from-green-500 to-emerald-600',
      tip: [
        '"24시간 룰"을 적용해보세요! 사고 싶은 물건을 장바구니에 넣고 하루만 기다려보세요.'
      ]
    }
  }
  
  // 3. 계획형: 적당한 소비, 일정한 패턴
  else if (dailyExpense <= CONSUMPTION_THRESHOLDS.PLANNER_DAILY_EXPENSE && avgTransaction <= CONSUMPTION_THRESHOLDS.PLANNER_AVG_TRANSACTION) {
    return {
      type: 'planner',
      title: '계획형 소비자',
      description: '필요와 욕구를 잘 구분하고 있어요. 이런 균형잡힌 소비 습관이 돈 관리의 핵심이에요!',
      icon: BadgeCheck,
      color: 'from-emerald-500 to-teal-600',
      tip: [
        '월별 예산을 카테고리별로 나눠서 더 체계적으로 관리해보세요!'
      ]
    }
  }
  
  // 4. 트렌드형: 평균 이상 소비, 다양한 카테고리
  else {
    return {
      type: 'trendy',
      title: '트렌드 소비자',
      description: '새로운 것에 대한 호기심이 많고 다양한 경험을 추구하는 멋진 스타일이에요!',
      icon: DollarSign,
      color: 'from-teal-500 to-green-600',
      tip: [
        '새로운 경험도 소중하지만 저축도 잊지 마세요!'
      ]
    }
  }
}

/**
 * 특정 월의 지출 금액을 계산하는 헬퍼 함수
 * @param transactions - 전체 거래 내역 배열
 * @param year - 년도
 * @param month - 월 (1-12)
 * @param isCurrentMonth - 현재 월인지 여부
 * @returns 해당 월의 지출 금액
 */
const calculateMonthlyExpenses = (
  transactions: Transaction[],
  year: number,
  month: number,
  isCurrentMonth: boolean = false
): number => {
  // UTC 기준으로 월 시작과 끝을 정확히 계산
  const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
  const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))

  // 해당 월의 실제 지출 계산
  const filteredTransactions = transactions.filter(tx => {
    if (!tx.transactionDate || tx.amount >= 0) return false
    const txDate = new Date(tx.transactionDate)
    return !isNaN(txDate.getTime()) && txDate >= monthStart && txDate <= monthEnd
  })

  const monthlyExpenses = filteredTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)


  // 현재 월인 경우 예상 지출로 계산
  if (isCurrentMonth) {
    const { currentMonthExpected } = getCurrentMonthProjection(transactions)
    return currentMonthExpected
  }

  return monthlyExpenses
}

/**
 * 월별 지출 분석을 수행합니다.
 * @param transactions - 전체 거래 내역 배열
 * @param selectedMonth - 선택된 월 (YYYY-MM 형식, 선택사항)
 * @returns 월별 분석 결과 배열 (선택된 월 기준 6개월, 미래 월 포함)
 */
export const getMonthlyAnalysis = (
  transactions: Transaction[],
  selectedMonth?: string
): MonthlyAnalysisItem[] => {
  if (!transactions || transactions.length === 0) {
    return []
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-12

  // 선택된 월이 있으면 해당 월 기준으로, 없으면 현재 월 기준으로
  let baseYear = currentYear
  let baseMonth = currentMonth

  if (selectedMonth && selectedMonth.includes('-')) {
    const [year, month] = selectedMonth.split('-').map(Number)
    if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
      // 현재 월을 넘어서는 미래 월은 제한
      if (year < currentYear || (year === currentYear && month <= currentMonth)) {
        baseYear = year
        baseMonth = month
      } else {
        baseYear = currentYear
        baseMonth = currentMonth
      }
    }
  }
  // selectedMonth가 없으면 현재 월을 선택된 상태로 설정
  else {
    // 현재 월을 선택된 상태로 표시하기 위해 selectedMonth를 현재 월로 설정
    selectedMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`
  }

  // 선택된 월을 기준으로 6개월 데이터 생성 (선택된 월이 가운데에 오도록)
  const monthlyData: MonthlyAnalysisItem[] = []
  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ]

  // 항상 6개월이 표시되도록 로직 수정
  // 선택된 월을 기준으로 앞뒤로 6개월 범위를 설정하되, 현재 월을 넘어서지 않도록 조정
  let startOffset: number
  let endOffset: number

  if (baseYear === currentYear && baseMonth === currentMonth) {
    // 이번 달을 선택한 경우: 과거 5개월 + 이번 달
    startOffset = -5
    endOffset = 0
  } else {
    // 다른 달을 선택한 경우: 선택된 달을 가운데에 두고 앞뒤 3개월씩
    startOffset = -3
    endOffset = 2
  }

  // 6개월이 모두 표시되도록 조정
  const monthsToShow: MonthlyAnalysisItem[] = []
  
  for (let i = startOffset; i <= endOffset; i++) {
    let targetYear = baseYear
    let targetMonth = baseMonth + i

    // 월이 1보다 작으면 이전 년도로 조정
    if (targetMonth <= 0) {
      targetMonth += 12
      targetYear -= 1
    }
    // 월이 12보다 크면 다음 년도로 조정
    else if (targetMonth > 12) {
      targetMonth -= 12
      targetYear += 1
    }

    // 현재 월을 넘어서는 미래 월은 제외
    if (targetYear > currentYear || (targetYear === currentYear && targetMonth > currentMonth)) {
      continue
    }

    const monthKey = `${targetYear}-${targetMonth.toString().padStart(2, '0')}`
    const isCurrentMonth = targetYear === currentYear && targetMonth === currentMonth

    // 해당 월의 지출 계산 (헬퍼 함수 사용)
    const monthlyExpenses = calculateMonthlyExpenses(transactions, targetYear, targetMonth, isCurrentMonth)

    monthsToShow.push({
      month: monthNames[targetMonth - 1],
      year: targetYear,
      monthNumber: targetMonth,
      amount: monthlyExpenses,
      isCurrentMonth,
      isSelected: selectedMonth === monthKey
    })
  }

  // 6개월이 모두 표시되지 않으면 과거 월을 더 추가
  while (monthsToShow.length < 6) {
    // 가장 이른 월보다 한 달 더 이전 월 추가
    const earliestMonth = monthsToShow[0]
    let prevYear = earliestMonth.year
    let prevMonth = earliestMonth.monthNumber - 1
    
    if (prevMonth <= 0) {
      prevMonth = 12
      prevYear -= 1
    }

    const monthKey = `${prevYear}-${prevMonth.toString().padStart(2, '0')}`
    const isCurrentMonth = prevYear === currentYear && prevMonth === currentMonth

    // 해당 월의 지출 계산 (헬퍼 함수 사용)
    const monthlyExpenses = calculateMonthlyExpenses(transactions, prevYear, prevMonth, isCurrentMonth)

    monthsToShow.unshift({
      month: monthNames[prevMonth - 1],
      year: prevYear,
      monthNumber: prevMonth,
      amount: monthlyExpenses,
      isCurrentMonth,
      isSelected: selectedMonth === monthKey
    })
  }

  // monthlyData에 추가
  monthlyData.push(...monthsToShow)

  // 디버깅용 로그
  console.log('Generated Monthly Data:', monthlyData.map(item => ({ 
    month: item.month, 
    amount: item.amount, 
    year: item.year,
    monthNumber: item.monthNumber,
    isCurrentMonth: item.isCurrentMonth,
    isSelected: item.isSelected
  })))
  
  // 이번 달 예상 값 디버깅
  const currentMonthData = monthlyData.find(item => item.isCurrentMonth)
  if (currentMonthData) {
    console.log('Current Month Data:', {
      month: currentMonthData.month,
      amount: currentMonthData.amount,
      isCurrentMonth: currentMonthData.isCurrentMonth
    })
  }

  return monthlyData
}

/**
 * 현재 시점에서의 예상 지출과 평균 지출을 계산합니다.
 * @param transactions - 전체 거래 내역 배열
 * @returns 현재 월 예상 지출과 전체 평균 지출
 */
export const getCurrentMonthProjection = (transactions: Transaction[]): {
  currentMonthExpected: number
  overallAverage: number
} => {
  if (!transactions || transactions.length === 0) {
    return { currentMonthExpected: 0, overallAverage: 0 }
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // 현재 월의 지출 계산 (UTC 기준)
  const currentMonthStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1, 0, 0, 0, 0))
  const currentMonthEnd = now

  const currentMonthExpenses = transactions
    .filter(tx => {
      if (!tx.transactionDate || tx.amount >= 0) return false
      const txDate = new Date(tx.transactionDate)
      return !isNaN(txDate.getTime()) && txDate >= currentMonthStart && txDate <= currentMonthEnd
    })
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

  // 현재 월의 예상 지출 (현재까지의 지출을 기반으로 한 달 전체 예상)
  const daysInCurrentMonth = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999)).getUTCDate()
  const daysPassed = now.getDate()
  const currentMonthProjected = daysPassed > 0 ? (currentMonthExpenses / daysPassed) * daysInCurrentMonth : 0

  // 전체 평균 지출 (최근 6개월 기준, 0원인 달 제외)
  const monthlyExpenses: number[] = []
  for (let i = 5; i >= 0; i--) {
    let targetYear = currentYear
    let targetMonth = currentMonth - i
    
    // 월이 1보다 작으면 이전 년도로 조정
    if (targetMonth <= 0) {
      targetMonth += 12
      targetYear -= 1
    }
    
    // 현재 월은 제외하고 계산
    if (targetYear === currentYear && targetMonth === currentMonth) {
      continue
    }
    
    const monthExpenses = calculateMonthlyExpenses(transactions, targetYear, targetMonth, false)
    
    // 0원이 아닌 달만 추가
    if (monthExpenses > 0) {
      monthlyExpenses.push(monthExpenses)
    }
  }
  
  const overallAverage = monthlyExpenses.length > 0 
    ? monthlyExpenses.reduce((sum, amount) => sum + amount, 0) / monthlyExpenses.length 
    : 0

  // 월 진행률에 따른 예상값 계산
  const monthProgress = daysPassed / daysInCurrentMonth
  let currentMonthExpected: number

  if (monthProgress < 0.3) {
    // 월의 30% 미만: 평균값 사용 (데이터가 부족하므로)
    currentMonthExpected = overallAverage
  } else if (monthProgress < 0.7) {
    // 월의 30-70%: 현재 예상값과 평균값의 가중평균
    const weight = monthProgress
    currentMonthExpected = (currentMonthProjected * weight) + (overallAverage * (1 - weight))
  } else {
    // 월의 70% 이상: 현재 예상값 사용 (거의 확정적)
    currentMonthExpected = currentMonthProjected
  }

  // 현재까지의 지출이 이미 평균을 크게 넘어섰다면 현재 예상값 사용
  if (currentMonthExpenses > overallAverage * 1.2) {
    currentMonthExpected = currentMonthProjected
  }

  return {
    currentMonthExpected: Math.round(currentMonthExpected),
    overallAverage: Math.round(overallAverage)
  }
}

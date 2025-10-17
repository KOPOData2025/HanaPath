"use client"

import React from "react"
import { motion } from "framer-motion"
import { useAuthStore } from "@/store/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Star, 
  DollarSign, 
  ShoppingCart, 
  PiggyBank, 
  Target, 
  Lightbulb,
  Puzzle,
  Store,
  Truck,
  Coffee,
  BookOpen,
  Film,
  Gamepad2,
  Bike,
  Train,
  Car,
  Heart,
  Clover,
  Receipt
} from "lucide-react"

interface ConsumptionTypeData {
  type: string
  title: string
  description: string
  icon: any
  color: string
  tip: string[]
}

interface PuzzleConsumptionCard {
  id: string
  title: string
  description: string
  icon: any
  color: string
  percentage: number
  amount: number
}

// 소비 카테고리 정의
const consumptionCategories: PuzzleConsumptionCard[] = [
  {
    id: "convenience",
    title: "편의점 마니아",
    description: "언제든지 찾아가는 편의점",
    icon: Store,
    color: "from-teal-400 to-teal-500",
    percentage: 15,
    amount: 125000
  },
  {
    id: "delivery",
    title: "배달앱 VIP",
    description: "집에서 편하게 주문하는 배달",
    icon: Truck,
    color: "from-emerald-400 to-emerald-500",
    percentage: 12,
    amount: 98000
  },
  {
    id: "cafe",
    title: "카페 러버",
    description: "아메리카노 한 잔의 여유",
    icon: Coffee,
    color: "from-cyan-400 to-cyan-500",
    percentage: 8,
    amount: 65000
  },
  {
    id: "books",
    title: "독서 러버",
    description: "책 속에서 찾는 지식과 영감",
    icon: BookOpen,
    color: "from-teal-500 to-teal-600",
    percentage: 6,
    amount: 45000
  },
  {
    id: "movies",
    title: "영화 러버",
    description: "대형 스크린에서 만나는 감동",
    icon: Film,
    color: "from-emerald-500 to-emerald-600",
    percentage: 5,
    amount: 38000
  },
  {
    id: "games",
    title: "게임 러버",
    description: "가상 세계에서 펼치는 모험",
    icon: Gamepad2,
    color: "from-cyan-500 to-cyan-600",
    percentage: 4,
    amount: 32000
  },
  {
    id: "bike",
    title: "따릉이 러버",
    description: "친환경 자전거로 건강한 이동",
    icon: Bike,
    color: "from-teal-600 to-teal-700",
    percentage: 3,
    amount: 25000
  },
  {
    id: "subway",
    title: "지하철 네비게이터",
    description: "지하철로 빠르고 안전한 이동",
    icon: Train,
    color: "from-emerald-600 to-emerald-700",
    percentage: 7,
    amount: 55000
  },
  {
    id: "taxi",
    title: "택시 VIP",
    description: "편안하고 빠른 이동의 선택",
    icon: Car,
    color: "from-teal-400 to-cyan-400",
    percentage: 2,
    amount: 18000
  },
  {
    id: "support",
    title: "최애 서포터",
    description: "좋아하는 것에 아낌없이 투자",
    icon: Heart,
    color: "from-emerald-400 to-teal-400",
    percentage: 1,
    amount: 12000
  }
]

interface AnalysisConsumptionTypeProps {
  consumptionType: ConsumptionTypeData
  transactions?: any[] // 실제 거래 데이터
  userName?: string // 사용자 이름
}

// 실제 사용자 소비 패턴 분석 함수
function analyzeUserConsumptionPattern(transactions: any[]): PuzzleConsumptionCard[] {
  // 기본 퍼즐 3개 정의 (편의점 마니아, 배달앱 VIP, 카페 러버)
  const defaultPuzzleIds = ['convenience', 'delivery', 'cafe']
  
  // 카테고리별 지출 분석
  const categoryTotals: Record<string, number> = {}
  
  transactions.forEach(tx => {
    if (tx.amount < 0) { // 지출만
      const category = tx.category || '기타'
      categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(tx.amount)
    }
  })

  // 카테고리 매핑 (실제 거래 내역 카테고리 기준)
  const categoryMapping: Record<string, string> = {
    '스토어': 'convenience',      // 편의점 마니아
    '음식': 'delivery',          // 배달앱 VIP  
    '문화': 'cafe',              // 카페 러버
    '쇼핑': 'books',             // 독서 러버
    '교통': 'bike',              // 따릉이 러버
    '용돈': 'movies',            // 영화 러버
    '저축': 'games',             // 게임 러버
    '송금': 'subway',            // 지하철 네비게이터
    '이체': 'taxi',              // 택시 VIP
    '입금': 'support',           // 최애 서포터
    '기타': 'convenience'        // 기타는 편의점으로 매핑
  }

  // 사용자 데이터가 있으면 상위 카테고리들을 찾기
  const sortedCategories = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)
    .map(([category, amount]) => ({
      category,
      amount,
      puzzleId: categoryMapping[category] || 'convenience'
    }))

  // 중복되지 않는 퍼즐 카드 ID들만 추출 (최대 3개)
  const userPuzzleIds: string[] = []
  for (const item of sortedCategories) {
    if (!userPuzzleIds.includes(item.puzzleId) && userPuzzleIds.length < 3) {
      userPuzzleIds.push(item.puzzleId)
    }
  }

  // 최종 퍼즐 ID 결정: 사용자 데이터 + 기본값으로 3개 보장
  const finalPuzzleIds: string[] = []
  
  // 1. 사용자 데이터에서 나온 퍼즐 ID들 추가
  finalPuzzleIds.push(...userPuzzleIds)
  
  // 2. 3개가 안 되면 기본값으로 채우기
  for (const defaultId of defaultPuzzleIds) {
    if (!finalPuzzleIds.includes(defaultId) && finalPuzzleIds.length < 3) {
      finalPuzzleIds.push(defaultId)
    }
  }

  // 총 지출 금액 계산
  const totalAmount = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0)

  // 퍼즐 카드 생성
  return finalPuzzleIds.map((puzzleId) => {
    const baseCard = consumptionCategories.find(c => c.id === puzzleId) || consumptionCategories[0]
    
    // 해당 퍼즐 ID와 매칭되는 카테고리들의 총 금액 계산
    const matchingCategories = sortedCategories.filter(item => item.puzzleId === puzzleId)
    const cardAmount = matchingCategories.reduce((sum, item) => sum + item.amount, 0)
    
    return {
      ...baseCard,
      amount: cardAmount,
      percentage: totalAmount > 0 ? Math.round((cardAmount / totalAmount) * 100) : 0
    }
  })
}

// 둥근 탭/슬롯을 가진 퍼즐 조각 모양 카드 생성 함수
function getModernPuzzlePath(cardId: string, index: number): string {
  const padding = 10
  const width = 320
  const height = 320 
  const tabRadius = 28 
  const cornerRadius = 10 
  
  // 둥근 탭과 슬롯을 가진 실제 퍼즐 모양 (완전한 반원)
  const roundPuzzleShapes = [
    // 첫 번째 조각: 위쪽 둥근 슬롯, 오른쪽 둥근 슬롯, 아래쪽 둥근 슬롯
    `M${padding + cornerRadius},${padding}
     L${padding + width * 0.35},${padding}
     C${padding + width * 0.35},${padding + tabRadius * 0.5} ${padding + width * 0.5 - tabRadius * 1.2},${padding + tabRadius * 1.5} ${padding + width * 0.5},${padding + tabRadius * 1.5}
     C${padding + width * 0.5 + tabRadius * 1.2},${padding + tabRadius * 1.5} ${padding + width * 0.65},${padding + tabRadius * 0.5} ${padding + width * 0.65},${padding}
     L${padding + width - cornerRadius},${padding}
     C${padding + width - cornerRadius/2},${padding} ${padding + width},${padding + cornerRadius/2} ${padding + width},${padding + cornerRadius}
     L${padding + width},${padding + height * 0.35}
     C${padding + width - tabRadius * 0.5},${padding + height * 0.35} ${padding + width - tabRadius * 1.5},${padding + height * 0.5 - tabRadius * 1.2} ${padding + width - tabRadius * 1.5},${padding + height * 0.5}
     C${padding + width - tabRadius * 1.5},${padding + height * 0.5 + tabRadius * 1.2} ${padding + width - tabRadius * 0.5},${padding + height * 0.65} ${padding + width},${padding + height * 0.65}
     L${padding + width},${padding + height - cornerRadius}
     C${padding + width},${padding + height - cornerRadius/2} ${padding + width - cornerRadius/2},${padding + height} ${padding + width - cornerRadius},${padding + height}
     L${padding + width * 0.65},${padding + height}
     C${padding + width * 0.65},${padding + height - tabRadius * 0.5} ${padding + width * 0.5 + tabRadius * 1.2},${padding + height - tabRadius * 1.5} ${padding + width * 0.5},${padding + height - tabRadius * 1.5}
     C${padding + width * 0.5 - tabRadius * 1.2},${padding + height - tabRadius * 1.5} ${padding + width * 0.35},${padding + height - tabRadius * 0.5} ${padding + width * 0.35},${padding + height}
     L${padding + cornerRadius},${padding + height}
     C${padding + cornerRadius/2},${padding + height} ${padding},${padding + height - cornerRadius/2} ${padding},${padding + height - cornerRadius}
     L${padding},${padding + cornerRadius}
     C${padding},${padding + cornerRadius/2} ${padding + cornerRadius/2},${padding} ${padding + cornerRadius},${padding} Z`,
    
    // 두 번째 조각: 위쪽 둥근 슬롯, 오른쪽 둥근 슬롯, 왼쪽 둥근 슬롯
    `M${padding + cornerRadius},${padding}
     L${padding + width * 0.35},${padding}
     C${padding + width * 0.35},${padding + tabRadius * 0.5} ${padding + width * 0.5 - tabRadius * 1.2},${padding + tabRadius * 1.5} ${padding + width * 0.5},${padding + tabRadius * 1.5}
     C${padding + width * 0.5 + tabRadius * 1.2},${padding + tabRadius * 1.5} ${padding + width * 0.65},${padding + tabRadius * 0.5} ${padding + width * 0.65},${padding}
     L${padding + width - cornerRadius},${padding}
     C${padding + width - cornerRadius/2},${padding} ${padding + width},${padding + cornerRadius/2} ${padding + width},${padding + cornerRadius}
     L${padding + width},${padding + height * 0.35}
     C${padding + width - tabRadius * 0.5},${padding + height * 0.35} ${padding + width - tabRadius * 1.5},${padding + height * 0.5 - tabRadius * 1.2} ${padding + width - tabRadius * 1.5},${padding + height * 0.5}
     C${padding + width - tabRadius * 1.5},${padding + height * 0.5 + tabRadius * 1.2} ${padding + width - tabRadius * 0.5},${padding + height * 0.65} ${padding + width},${padding + height * 0.65}
     L${padding + width},${padding + height - cornerRadius}
     C${padding + width},${padding + height - cornerRadius/2} ${padding + width - cornerRadius/2},${padding + height} ${padding + width - cornerRadius},${padding + height}
     L${padding + cornerRadius},${padding + height}
     C${padding + cornerRadius/2},${padding + height} ${padding},${padding + height - cornerRadius/2} ${padding},${padding + height - cornerRadius}
     L${padding},${padding + height * 0.65}
     C${padding - tabRadius * 0.5},${padding + height * 0.65} ${padding - tabRadius * 1.5},${padding + height * 0.5 + tabRadius * 1.2} ${padding - tabRadius * 1.5},${padding + height * 0.5}
     C${padding - tabRadius * 1.5},${padding + height * 0.5 - tabRadius * 1.2} ${padding - tabRadius * 0.5},${padding + height * 0.35} ${padding},${padding + height * 0.35}
     L${padding},${padding + cornerRadius}
     C${padding},${padding + cornerRadius/2} ${padding + cornerRadius/2},${padding} ${padding + cornerRadius},${padding} Z`,
    
    // 세 번째 조각: 위쪽 둥근 탭, 아래쪽 둥근 슬롯, 왼쪽 둥근 탭
    `M${padding + cornerRadius},${padding}
     L${padding + width * 0.35},${padding}
     C${padding + width * 0.35},${padding - tabRadius * 0.5} ${padding + width * 0.5 - tabRadius * 1.2},${padding - tabRadius * 1.5} ${padding + width * 0.5},${padding - tabRadius * 1.5}
     C${padding + width * 0.5 + tabRadius * 1.2},${padding - tabRadius * 1.5} ${padding + width * 0.65},${padding - tabRadius * 0.5} ${padding + width * 0.65},${padding}
     L${padding + width - cornerRadius},${padding}
     C${padding + width - cornerRadius/2},${padding} ${padding + width},${padding + cornerRadius/2} ${padding + width},${padding + cornerRadius}
     L${padding + width},${padding + height - cornerRadius}
     C${padding + width},${padding + height - cornerRadius/2} ${padding + width - cornerRadius/2},${padding + height} ${padding + width - cornerRadius},${padding + height}
     L${padding + width * 0.65},${padding + height}
     C${padding + width * 0.65},${padding + height - tabRadius * 0.5} ${padding + width * 0.5 + tabRadius * 1.2},${padding + height - tabRadius * 1.5} ${padding + width * 0.5},${padding + height - tabRadius * 1.5}
     C${padding + width * 0.5 - tabRadius * 1.2},${padding + height - tabRadius * 1.5} ${padding + width * 0.35},${padding + height - tabRadius * 0.5} ${padding + width * 0.35},${padding + height}
     L${padding + cornerRadius},${padding + height}
     C${padding + cornerRadius/2},${padding + height} ${padding},${padding + height - cornerRadius/2} ${padding},${padding + height - cornerRadius}
     L${padding},${padding + height * 0.65}
     C${padding - tabRadius * 0.5},${padding + height * 0.65} ${padding - tabRadius * 1.5},${padding + height * 0.5 + tabRadius * 1.2} ${padding - tabRadius * 1.5},${padding + height * 0.5}
     C${padding - tabRadius * 1.5},${padding + height * 0.5 - tabRadius * 1.2} ${padding - tabRadius * 0.5},${padding + height * 0.35} ${padding},${padding + height * 0.35}
     L${padding},${padding + cornerRadius}
     C${padding},${padding + cornerRadius/2} ${padding + cornerRadius/2},${padding} ${padding + cornerRadius},${padding} Z`
  ]
  
  return roundPuzzleShapes[index % roundPuzzleShapes.length]
}

// 퍼즐 모양 소비 카드 컴포넌트
function PuzzleConsumptionCard({ card, index }: { card: PuzzleConsumptionCard, index: number }) {
  const cardPath = getModernPuzzlePath(card.id, index)
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: index % 2 === 0 ? -2 : 2 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        rotate: [index % 2 === 0 ? -1 : 1, index % 2 === 0 ? -2 : 2, index % 2 === 0 ? -1 : 1]
      }}
      transition={{ 
        type: "spring", 
        stiffness: 200,
        delay: index * 0.1,
        rotate: {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
      whileHover={{ 
        scale: 1.05, 
        rotate: index % 2 === 0 ? -3 : 3,
        transition: { type: "spring", stiffness: 300 }
      }}
      className="relative group cursor-pointer w-full h-[250px]"
    >
      {/* 퍼즐 조각 모양 SVG */}
      <svg
        className="w-full h-full"
        viewBox="-50 -50 400 400"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* 각 카드별 그라데이션 */}
          <linearGradient id={`puzzle-gradient-${card.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            {card.id === "convenience" && (
              <>
                <stop offset="0%" stopColor="rgb(45 212 191)" />
                <stop offset="100%" stopColor="rgb(20 184 166)" />
              </>
            )}
            {card.id === "delivery" && (
              <>
                <stop offset="0%" stopColor="rgb(52 211 153)" />
                <stop offset="100%" stopColor="rgb(16 185 129)" />
              </>
            )}
            {card.id === "cafe" && (
              <>
                <stop offset="0%" stopColor="rgb(34 211 238)" />
                <stop offset="100%" stopColor="rgb(6 182 212)" />
              </>
            )}
            {card.id === "books" && (
              <>
                <stop offset="0%" stopColor="rgb(20 184 166)" />
                <stop offset="100%" stopColor="rgb(13 148 136)" />
              </>
            )}
            {card.id === "movies" && (
              <>
                <stop offset="0%" stopColor="rgb(16 185 129)" />
                <stop offset="100%" stopColor="rgb(5 150 105)" />
              </>
            )}
            {card.id === "games" && (
              <>
                <stop offset="0%" stopColor="rgb(6 182 212)" />
                <stop offset="100%" stopColor="rgb(8 145 178)" />
              </>
            )}
            {card.id === "bike" && (
              <>
                <stop offset="0%" stopColor="rgb(13 148 136)" />
                <stop offset="100%" stopColor="rgb(15 118 110)" />
              </>
            )}
            {card.id === "subway" && (
              <>
                <stop offset="0%" stopColor="rgb(5 150 105)" />
                <stop offset="100%" stopColor="rgb(4 120 87)" />
              </>
            )}
            {card.id === "taxi" && (
              <>
                <stop offset="0%" stopColor="rgb(45 212 191)" />
                <stop offset="100%" stopColor="rgb(34 211 238)" />
              </>
            )}
            {card.id === "support" && (
              <>
                <stop offset="0%" stopColor="rgb(52 211 153)" />
                <stop offset="100%" stopColor="rgb(45 212 191)" />
              </>
            )}
          </linearGradient>
          
          {/* 퍼즐 조각 모양 클리핑 패스 */}
          <clipPath id={`card-clip-${card.id}`}>
            <path d={cardPath} />
          </clipPath>
          
          {/* 그림자 필터 - 제거됨 */}
        </defs>
        
        {/* 퍼즐 조각 배경 */}
        <rect
          width="400"
          height="400"
          x="-50"
          y="-50"
          fill={`url(#puzzle-gradient-${card.id})`}
          clipPath={`url(#card-clip-${card.id})`}
        />
        
        {/* 퍼즐 조각 테두리 - 제거됨 */}
        
      </svg>
      
      {/* 카드 내용 */}
      <div className="absolute inset-0 px-4 py-2 flex flex-col items-center justify-center text-center mt-3">
        {/* 첫째줄: 아이콘 */}
        <div className="w-12 h-12 bg-white/25 rounded-2xl flex items-center justify-center mb-3 ml-5">
          <card.icon className="w-6 h-6 text-white" />
        </div>
        
        {/* 둘째줄: 제목 */}
        <h3 className="text-white font-bold text-base mb-2 text-center ml-5">{card.title}</h3>
        
        {/* 셋째줄: 설명 */}
        <p className="text-white/90 text-xs leading-relaxed text-center ml-5">{card.description}</p>
      </div>
      
       {/* 호버 효과 - clipPath 대신 다른 방식으로 구현 */}
       <motion.div
         className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
         whileHover={{ scale: 1.02 }}
         transition={{ type: "spring", stiffness: 300 }}
       >
         <svg
           className="w-full h-full"
           viewBox="-50 -50 400 400"
           preserveAspectRatio="xMidYMid meet"
         >
           <defs>
             <linearGradient id={`hover-gradient-${card.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
               <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
               <stop offset="100%" stopColor="rgba(255,255,255,0.2)" />
             </linearGradient>
           </defs>
           <rect
             width="400"
             height="400"
             x="-50"
             y="-50"
             fill={`url(#hover-gradient-${card.id})`}
             clipPath={`url(#card-clip-${card.id})`}
           />
         </svg>
       </motion.div>
    </motion.div>
  )
}

export default function AnalysisConsumptionType({ consumptionType, transactions = [], userName }: AnalysisConsumptionTypeProps) {
  const { user } = useAuthStore()
  
  // 실제 사용자 이름 가져오기
  const displayName = userName || user?.name || user?.nickname || '사용자'
  
  // 실제 사용자 데이터 분석 (필터링된 거래 내역 사용)
  const userPuzzleCards = analyzeUserConsumptionPattern(transactions)
  return (
    <Card className="shadow-lg border border-gray-200/50 rounded-2xl">
      <CardHeader className="bg-gradient-to-r from-teal-500 to-teal-700 text-white rounded-t-2xl relative overflow-hidden">
        {/* 퍼즐 그림자 효과 */}
        <div className="absolute top-4 right-4 w-20 h-20 opacity-20">
          <Puzzle 
            className="w-20 h-20 text-white drop-shadow-2xl" 
            fill="currentColor"
          />
        </div>
        
        <CardTitle className="text-xl font-semibold flex items-center gap-2 relative z-10 !mt-0">
          <Receipt className="w-5 h-5" />
          소비 유형
        </CardTitle>
         <CardDescription className="text-teal-100 relative z-10 !mt-3 !mb-1">
           당신만의 소비 패턴입니다
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
          className="relative min-h-[300px]"
        >
          <div className="flex flex-col items-center gap-8">
            {/* 중앙: 아이콘과 타이틀 */}
            <div className="w-full max-w-2xl flex justify-center">
              <div className="flex items-center gap-6">
                <motion.div
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${consumptionType.color} flex items-center justify-center shadow-lg relative overflow-hidden flex-shrink-0`}
                  animate={{ 
                    rotate: [0, 2, -2, 0],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  {/* 아이콘 */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  >
                    {consumptionType.icon && <consumptionType.icon className="w-10 h-10 text-white drop-shadow-lg" />}
                  </motion.div>
                </motion.div>
                
                <div className="flex flex-col items-start flex-1">
                  <motion.h3 
                    className="text-2xl font-bold text-[#0F766E] mb-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {consumptionType.title}
                  </motion.h3>
                  
                  <motion.p 
                    className="text-base text-gray-600 font-medium text-left"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    {consumptionType.description}
                  </motion.p>
                  
                  <motion.div
                    className="flex items-start gap-2 mt-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <motion.div
                      className="flex-shrink-0 mt-0.5"
                      animate={{ 
                        rotate: [0, 3, -3, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    >
                      <Clover className="w-4 h-4 text-green-500" />
                    </motion.div>
                    
                    <div className="text-sm text-gray-500 font-medium text-left">
                      {consumptionType.tip.map((line, index) => (
                        <p key={index} className="mb-1 last:mb-0">
                          {line}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 퍼즐 소비 카드 섹션 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, type: "spring", stiffness: 100 }}
            className="mt-12"
          >
            <div className="text-center">
              <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                {displayName}님의 소비 퍼즐
                <motion.svg 
                  className="inline-block w-8 h-8 ml-2 text-emerald-500" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z"/>
                </motion.svg>
              </h3>
              <p className="text-gray-600">하나패스 사용자 중 상위 5%만 달성한 특별한 소비 퍼즐이에요!</p>
            </div>
            
            {/* 퍼즐 카드 그리드 - 가로 배치 */}
            <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
              {userPuzzleCards.slice(0, 3).map((card, index) => (
              <motion.div
                  key={`${card.id}-${transactions?.length || 0}-${JSON.stringify(transactions?.slice(0, 3).map(t => t.id) || [])}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.3 }}
                  className="flex-1"
                >
                  <PuzzleConsumptionCard card={card} index={index} />
            </motion.div>
              ))}
            </div>
            
          </motion.div>
          
        </motion.div>
      </CardContent>
    </Card>
  )
}

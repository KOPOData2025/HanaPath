"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useAuthStore } from "@/store/auth"
import { motion } from "framer-motion"
import AnalysisPeriodSelector from "./analysis-period-selector"
import AnalysisConsumptionType from "./analysis-consumption-type"
import AnalysisTipsSection from "./analysis-tips-section"
import AnalysisChartSection from "./analysis-chart-section"
import { 
  Transaction,
  getFilteredTransactions,
  getMonthlyComparison,
  getCategoryAnalysis,
  getConsumptionType,
  getMonthlyAnalysis
} from "./analysis-utils"

interface AnalysisTabProps {
  transactions: Transaction[]
  userName?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const chartVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
      delay: 0.2
    }
  },
}



export default function AnalysisTab({ transactions, userName }: AnalysisTabProps) {
  const { user } = useAuthStore()
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'thisMonth' | 'lastMonth' | 'custom'>('thisMonth')
  const [selectedCustomMonth, setSelectedCustomMonth] = useState<string>('')
  const [selectedMonthlyMonth, setSelectedMonthlyMonth] = useState<string>(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    return `${currentYear}-${currentMonth.toString().padStart(2, '0')}`
  })
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({})

  // 실제 사용자 이름 가져오기
  const displayName = userName || user?.name || user?.nickname || '사용자'

  // 전월 대비 비교 데이터
  const monthlyComparison = useMemo(() => {
    return getMonthlyComparison(transactions, selectedPeriod, selectedCustomMonth)
  }, [transactions, selectedPeriod, selectedCustomMonth])


  // 기간별 필터링된 거래 내역
  const filteredTransactions = useMemo(() => {
    return getFilteredTransactions(transactions, selectedPeriod, selectedCustomMonth)
  }, [transactions, selectedPeriod, selectedCustomMonth])

  // 카테고리별 지출 분석
  const categoryAnalysis = useMemo(() => {
    return getCategoryAnalysis(filteredTransactions)
  }, [filteredTransactions])

  // 소비 유형 분석
  const consumptionType = useMemo(() => {
    return getConsumptionType(filteredTransactions)
  }, [filteredTransactions])

  // 월별 분석 데이터
  const monthlyAnalysis = useMemo(() => {
    return getMonthlyAnalysis(transactions, selectedMonthlyMonth)
  }, [transactions, selectedMonthlyMonth])


  // 애니메이션 값 업데이트
  useEffect(() => {
    const timer = setTimeout(() => {
      const newValues: Record<string, number> = {}
      categoryAnalysis.forEach(item => {
        newValues[item.category] = item.percentage
      })
      setAnimatedValues(newValues)
    }, 500)

    return () => clearTimeout(timer)
  }, [categoryAnalysis])


  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* 기간 선택 */}
      <motion.div variants={itemVariants} className="relative z-10">
        <AnalysisPeriodSelector
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          selectedCustomMonth={selectedCustomMonth}
          setSelectedCustomMonth={setSelectedCustomMonth}
          displayName={displayName}
        />
      </motion.div>

      {/* 모던 도넛 차트 섹션 */}
      <motion.div 
        variants={itemVariants}
        key={`chart-${selectedPeriod}-${selectedCustomMonth}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <AnalysisChartSection
          categoryAnalysis={categoryAnalysis}
          monthlyComparison={monthlyComparison}
          selectedPeriod={selectedPeriod}
          selectedCustomMonth={selectedCustomMonth}
        />
      </motion.div>


      {/* 소비 유형 분석 */}
      <motion.div variants={itemVariants}>
        <AnalysisConsumptionType 
          consumptionType={consumptionType} 
          transactions={filteredTransactions}
          userName={displayName}
        />
      </motion.div>

      {/* 소비 팁 섹션 (월별 차트 포함) */}
      <motion.div variants={itemVariants}>
        <AnalysisTipsSection 
          monthlyData={monthlyAnalysis}
          onMonthSelect={setSelectedMonthlyMonth}
          transactions={transactions}
        />
      </motion.div>

    </motion.div>
  )
}


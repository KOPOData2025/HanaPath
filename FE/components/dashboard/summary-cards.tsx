"use client"

import { motion, easeOut } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, Landmark, PiggyBank, TrendingUp, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth"
import { useEffect, useState } from "react"
import { getWalletBalance, getInvestmentAccountBalance } from "@/lib/api/wallet"
import { hanaMoneyApi } from "@/lib/api/hanamoney"
import { getLatestProfitRate } from "@/lib/api/performance"

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: easeOut,
    },
  },
}

const iconVariants = {
  hover: {
    scale: 1.2,
    rotate: 5,
    transition: {
      duration: 0.2,
    },
  },
}

interface SummaryData {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  icon: any
  href: string
  color: string
  bgColor: string
  textColor: string
  description: string
}

export function SummaryCards() {
  const { user } = useAuthStore()
  const [summaryData, setSummaryData] = useState<SummaryData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        // 병렬로 모든 데이터 가져오기
        const [walletBalance, investmentBalance, hanaMoney, profitRate] = await Promise.allSettled([
          getWalletBalance(user.id),
          getInvestmentAccountBalance(user.id),
          hanaMoneyApi.getHanaMoney(),
          getLatestProfitRate(user.id)
        ])

        const baseData: SummaryData[] = [
          {
            title: "내 지갑",
            value: "0원",
            change: "+0원",
            trend: "up",
            icon: Wallet,
            href: "/wallet",
            color: "from-blue-500 to-blue-600",
            bgColor: "bg-blue-50",
            textColor: "text-blue-600",
            description: "거래 내역을 확인해보세요",
          },
          {
            title: "모의 투자 계좌",
            value: "0원",
            change: "+0원",
            trend: "up",
            icon: Landmark,
            href: "/portfolio?slide=4",
            color: "from-indigo-500 to-indigo-600",
            bgColor: "bg-indigo-50",
            textColor: "text-indigo-600",
            description: "투자 계좌를 생성해보세요",
          },
          {
            title: "포트폴리오",
            value: "+0%",
            change: "+0%",
            trend: "up",
            icon: TrendingUp,
            href: "/portfolio",
            color: "from-rose-500 to-rose-600",
            bgColor: "bg-rose-50",
            textColor: "text-rose-600",
            description: "포트폴리오 정보가 없습니다",
          },
          {
            title: "하나머니",
            value: "0 P",
            change: "+0P",
            trend: "up",
            icon: PiggyBank,
            href: "/hanamoney",
            color: "from-teal-500 to-teal-600",
            bgColor: "bg-teal-50",
            textColor: "text-teal-600",
            description: "하나머니를 적립해보세요",
          },
        ]

        // 지갑 잔액 업데이트
        if (walletBalance.status === 'fulfilled' && walletBalance.value) {
          const balance = walletBalance.value.balance || 0
          baseData[0].value = `${balance.toLocaleString()}원`
          baseData[0].description = "지갑 잔액을 확인해보세요"
        }

        // 모의 투자 계좌 잔액 업데이트
        if (investmentBalance.status === 'fulfilled' && investmentBalance.value) {
          const balance = investmentBalance.value.balance || 0
          baseData[1].value = `${balance.toLocaleString()}원`
          baseData[1].description = "투자 계좌 잔액을 확인해보세요"
        }

        // 하나머니 업데이트
        if (hanaMoney.status === 'fulfilled' && hanaMoney.value.data) {
          const balance = hanaMoney.value.data.balance || 0
          baseData[3].value = `${balance.toLocaleString()} P`
          baseData[3].description = "하나머니를 적립해보세요"
        }

        // 포트폴리오 수익률 업데이트
        if (profitRate.status === 'fulfilled' && profitRate.value !== undefined) {
          const rate = Number(profitRate.value)
          const sign = rate >= 0 ? "+" : ""
          baseData[2].value = `${sign}${rate.toFixed(2)}%`
          baseData[2].change = `${sign}${rate.toFixed(2)}%`
          baseData[2].trend = rate >= 0 ? "up" : "down"
          baseData[2].description = rate !== 0 ? "포트폴리오 손익률을 확인해보세요" : "포트폴리오 정보가 없습니다"
        }

        setSummaryData(baseData)
      } catch (error) {
        console.error('사용자 데이터 가져오기 실패:', error)
        // 에러 시 기본 데이터 설정
        setSummaryData([
          {
            title: "내 지갑",
            value: "0원",
            change: "+0원",
            trend: "up",
            icon: Wallet,
            href: "/wallet",
            color: "from-blue-500 to-blue-600",
            bgColor: "bg-blue-50",
            textColor: "text-blue-600",
            description: "지갑을 생성해보세요",
          },
          {
            title: "모의 투자 계좌",
            value: "0원",
            change: "+0원",
            trend: "up",
            icon: Landmark,
            href: "/portfolio?slide=4",
            color: "from-indigo-500 to-indigo-600",
            bgColor: "bg-indigo-50",
            textColor: "text-indigo-600",
            description: "투자 계좌를 생성해보세요",
          },
          {
            title: "포트폴리오",
            value: "+0%",
            change: "+0%",
            trend: "up",
            icon: TrendingUp,
            href: "/portfolio",
            color: "from-rose-500 to-rose-600",
            bgColor: "bg-rose-50",
            textColor: "text-rose-600",
            description: "포트폴리오 정보가 없습니다",
          },
          {
            title: "하나머니",
            value: "0 P",
            change: "+0P",
            trend: "up",
            icon: PiggyBank,
            href: "/hanamoney",
            color: "from-teal-500 to-teal-600",
            bgColor: "bg-teal-50",
            textColor: "text-teal-600",
            description: "하나머니를 적립해보세요",
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user?.id])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="animate-pulse">
            <Card className="h-32 bg-gray-100" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {summaryData.map((item, index) => (
        <motion.div
          key={item.title}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: index * 0.1 }}
          whileHover={{
            y: -5,
            transition: { duration: 0.2 },
          }}
        >
          <Link href={item.href} className="block h-full">
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group h-full">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
              />

              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{item.title}</CardTitle>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-3 rounded-xl ${item.bgColor} group-hover:scale-110 transition-transform duration-300`}
                  >
                    <motion.div variants={iconVariants} whileHover="hover">
                      <item.icon className={`h-6 w-6 ${item.textColor}`} />
                    </motion.div>
                  </div>

                  {/* 오른쪽 상단에 증감률 띄워주던 뱃지 */}
                  {/* <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                      item.trend === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
                    )}
                  >
                    {item.trend === "up" ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingUp className="h-3 w-3 rotate-180" />
                    )}
                    {item.change}
                  </motion.div> */}
                </div>

                <div className="space-y-1">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="text-2xl font-bold text-gray-700"
                  >
                    {item.value}
                  </motion.p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>

                <div className="flex items-center text-xs text-gray-500 mt-4 group">
                  자세히 보기
                  <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>

                {/* Animated background decoration */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                    delay: index * 0.5,
                  }}
                  className={`absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br ${item.color} opacity-10`}
                />
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, BookOpen, Clock, Share2, ExternalLink, User, Lightbulb, FileText, Award, Timer } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { hanaMoneyApi } from "@/lib/api/hanamoney"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/store/auth"

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const renderStyledTextBlock = (text: string) => (
    <div className="text-gray-700 text-lg leading-relaxed space-y-4">
      {text.split("\n").map((line, idx) => (
          <p key={idx} className="indent-4">{line.trim()}</p>
      ))}
    </div>
)

export default function NewsDetailPage({ params }: { params: { id: string } }) {
  const id = params.id
  const [activeTab, setActiveTab] = useState("summary")
  const [news, setNews] = useState<any>(null)
  const [countdown, setCountdown] = useState(30) // 30초 카운트다운
  const [isReading, setIsReading] = useState(false)
  const [isRewarded, setIsRewarded] = useState(false)
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [showRewardBadge, setShowRewardBadge] = useState(false)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const rewardBadgeRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()
  const { isLoggedIn } = useAuthStore()

  useEffect(() => {
    if (!id) return

    // Authorization 헤더 포함하여 요청
    const token = localStorage.getItem('access_token')
    console.log('토큰 확인:', token ? '토큰 있음' : '토큰 없음')
    
    const headers: HeadersInit = {}
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
      console.log('Authorization 헤더 설정:', `Bearer ${token}`)
    }

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/news/${id}`, {
      headers
    })
        .then((res) => {
          if (!res.ok) throw new Error("뉴스 불러오기 실패")
          return res.json()
        })
        .then((data) => {
          console.log('=== 뉴스 데이터 로드 ===')
          console.log('받은 데이터:', data)
          console.log('isRewarded 값:', data.isRewarded)
          console.log('타입:', typeof data.isRewarded)
          
          // 이미 적립된 뉴스인지 확인
          if (data.isRewarded === true) {
            console.log('✅ 이미 적립된 뉴스 - 상태 설정')
            setIsRewarded(true)
            setIsReading(false)
          } else {
            console.log('❌ 아직 적립되지 않은 뉴스')
            setIsRewarded(false)
          }
          setNews(data)
        })
        .catch((err) => console.error("뉴스 불러오기 실패", err))
  }, [id])

  // 카운트다운 타이머
  useEffect(() => {
    if (isReading && countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
    } else if (countdown === 0 && isReading) {
      handleReward()
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current)
      }
    }
  }, [isReading, countdown])

  // 페이지 진입 시 읽기 시작
  useEffect(() => {
    console.log('=== 읽기 시작 useEffect ===')
    console.log('news:', !!news)
    console.log('isLoggedIn:', isLoggedIn)
    console.log('isRewarded:', isRewarded)
    console.log('news.isRewarded:', news?.isRewarded)
    
    if (news && isLoggedIn && !isRewarded && !news.isRewarded) {
      console.log('✅ 타이머 시작')
      setIsReading(true)
    } else {
      console.log('❌ 타이머 시작하지 않음')
      setIsReading(false)
    }
  }, [news, isLoggedIn, isRewarded])

  // 적립 완료 배지 자동 숨김
  useEffect(() => {
    if (showRewardBadge) {
      rewardBadgeRef.current = setTimeout(() => {
        setShowRewardBadge(false)
      }, 3000) // 3초 후 자동 숨김
    }

    return () => {
      if (rewardBadgeRef.current) {
        clearTimeout(rewardBadgeRef.current)
      }
    }
  }, [showRewardBadge])

  // 페이지 이탈 시 타이머 정리
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current)
      }
      if (rewardBadgeRef.current) {
        clearTimeout(rewardBadgeRef.current)
      }
    }
  }, [])

  const handleReward = async () => {
    if (!isLoggedIn) {
      toast({
        title: "로그인 필요",
        description: "하나머니 적립을 위해 로그인이 필요합니다.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await hanaMoneyApi.processNewsReadReward(id)
      if (response.data) {
        setIsRewarded(true)
        setIsReading(false)
        setShowRewardModal(true)
        setShowRewardBadge(true)
        toast({
          title: "하나머니 적립 완료!",
          description: `${response.data.amount}P가 적립되었습니다.`,
          duration: 8000, // 8초 동안 표시
        })
      } else if (response.error) {
        if (response.error.includes("이미 적립된 항목")) {
          setIsRewarded(true)
          setIsReading(false)
          toast({
            title: "이미 적립된 뉴스",
            description: "이 뉴스는 이미 적립을 받았습니다.",
          })
        } else {
          toast({
            title: "적립 실패",
            description: response.error,
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("뉴스 읽기 보상 처리 실패:", error)
      toast({
        title: "적립 실패",
        description: "적립 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!news) return null

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 relative">
        {/* 배경 패턴 */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width%3D%2260%22 height%3D%2260%22 viewBox%3D%220 0 60 60%22 xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg fill%3D%22none%22 fillRule%3D%22evenodd%22%3E%3Cg fill%3D%22%23009178%22 fillOpacity%3D%220.03%22%3E%3Ccircle cx%3D%2230%22 cy%3D%2230%22 r%3D%222%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50"></div>

        {/* 하나머니 적립 카운트다운 */}

        {(() => {
          console.log('=== 타이머 표시 조건 체크 ===')
          console.log('isLoggedIn:', isLoggedIn)
          console.log('isReading:', isReading)
          console.log('news:', !!news)
          console.log('!news.isRewarded:', !news?.isRewarded)
          console.log('최종 조건:', isLoggedIn && isReading && news && !news.isRewarded)
          return null
        })()}
        {isLoggedIn && isReading && news && !news.isRewarded && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed top-20 right-20 z-[9999]"
          >
            <Card className="bg-white shadow-2xl border border-gray-100 rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  {/* 상단 텍스트 */}
                  <div className="text-sm font-medium text-gray-600 mb-4">
                    하나머니 적립까지
                  </div>
                  
                  {/* 원형 타이머 */}
                  <div className="relative mb-4">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
                      {/* 배경 원 */}
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        stroke="#f3f4f6"
                        strokeWidth="8"
                        fill="none"
                      />
                      {/* 진행률 원 */}
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        stroke="#10b981"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 38}`}
                        strokeDashoffset={`${2 * Math.PI * 38 * (1 - (30 - countdown) / 30)}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    
                    {/* 중앙 텍스트 - 시간만 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-xl font-bold text-gray-900 tracking-wider">
                        {formatTime(countdown)}
                      </div>
                    </div>
                  </div>
                  
                  {/* 하단 진행률 바 */}
                  {/* <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${((30 - countdown) / 30) * 100}%` }}
                    ></div>
                  </div> */}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 적립 완료 배지 */}
        {isLoggedIn && showRewardBadge && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed top-20 right-6 z-[9999]"
          >
            <Card className="bg-white shadow-2xl border border-gray-100 rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <motion.div 
                      className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 0.6,
                        ease: "easeInOut"
                      }}
                    >
                      <Award className="w-6 h-6 text-white" />
                    </motion.div>
                    {/* 체크마크 애니메이션 */}
                    <motion.div
                      className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                    >
                      <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  </div>
                  <div className="flex-1">
                    <motion.p 
                      className="text-sm font-medium text-gray-500 mb-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      적립 완료!
                    </motion.p>
                    <motion.p 
                      className="text-2xl font-bold text-gray-600 tracking-wider"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      +50P
                    </motion.p>
                    <motion.div 
                      className="w-full bg-gray-200 rounded-full h-1.5 mt-2"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      <div className="bg-emerald-500 h-1.5 rounded-full w-full"></div>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100/50">
          <div className="container mx-auto p-4 max-w-4xl">
            <motion.div variants={fadeInUp} className="flex items-center justify-between">
              <Link
                  href="/news"
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-[#009178] transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">뉴스 목록</span>
              </Link>

              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-[#009178] hover:bg-[#009178]/10">
                <Share2 className="w-4 h-4 mr-2" />
                공유
              </Button>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto p-6 max-w-4xl relative z-10">
          <motion.div initial="initial" animate="animate" variants={staggerContainer}>
            {/* Article Header */}
            <motion.div variants={fadeInUp}>
              <Card className="overflow-hidden shadow-2xl border-0 bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-sm mb-8 rounded-3xl">
                {/* Hero Image */}
                <div className="relative h-80 overflow-hidden">
                  <Image
                      src={news.thumbnailUrl || "/placeholder.svg?width=800&height=400&text=News+Image"}
                      alt={news.title}
                      width={800}
                      height={400}
                      className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Category Badge */}
                  <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="absolute top-6 left-6"
                  >
                    <Badge className="bg-[#009178] text-white shadow-lg backdrop-blur-sm px-4 py-2 text-sm font-bold">
                      {news.category}
                    </Badge>
                  </motion.div>

                  {/* Article Meta */}
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="flex items-center gap-6 text-white/90 text-sm mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">{news.source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{news.publishedAt}</span>
                      </div>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-lg">
                      {news.title}
                    </h1>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Content Tabs */}
            <motion.div variants={fadeInUp}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/90 backdrop-blur-sm shadow-2xl h-14 rounded-3xl p-2 border border-white/50">
                  <TabsTrigger value="summary" className="flex items-center gap-2 data-[state=active]:bg-[#009178] data-[state=active]:text-white rounded-xl font-bold text-sm transition-all duration-300 h-full">
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">요약</span>
                  </TabsTrigger>
                  <TabsTrigger value="explanation" className="flex items-center gap-2 data-[state=active]:bg-[#009178] data-[state=active]:text-white rounded-xl font-bold text-sm transition-all duration-300 h-full">
                    <Lightbulb className="w-4 h-4" />
                    <span className="hidden sm:inline">쉬운 설명</span>
                  </TabsTrigger>
                  <TabsTrigger value="original" className="flex items-center gap-2 data-[state=active]:bg-[#009178] data-[state=active]:text-white rounded-xl font-bold text-sm transition-all duration-300 h-full">
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">원문 보기</span>
                  </TabsTrigger>
                </TabsList>

                {/*<TabsContent value="summary">*/}
                {/*  <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">*/}
                {/*    <CardContent className="p-8">*/}
                {/*      <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">*/}
                {/*        {news.summary}*/}
                {/*      </p>*/}
                {/*    </CardContent>*/}
                {/*  </Card>*/}
                {/*</TabsContent>*/}

                <TabsContent value="summary">
                  <Card className="shadow-2xl border-0 bg-gradient-to-br from-white/95 via-green-50/30 to-white/95 backdrop-blur-sm rounded-3xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#009178]/5 via-transparent to-[#009178]/5"></div>
                    <CardContent className="relative p-10 space-y-8">
                      {/* 섹션 헤더 */}
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#009178] to-[#00a085] rounded-2xl flex items-center justify-center shadow-lg">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-800">요약</h2>
                          <p className="text-gray-500 text-sm">핵심 내용을 한눈에 파악하세요</p>
                        </div>
                      </div>

                      {/* 요약 문장 분할 + 고급 스타일링 */}
                      <motion.div 
                        className="space-y-6"
                        initial="hidden"
                        animate="visible"
                        variants={{
                          hidden: { opacity: 0 },
                          visible: {
                            opacity: 1,
                            transition: {
                              staggerChildren: 0.4,
                              delayChildren: 0.2
                            }
                          }
                        }}
                      >
                        {news.summary
                            .split(/(?<=\.)\s+/)
                            .filter((sentence: string) => sentence.trim() !== "")
                            .map((sentence: string, index: number) => (
                                <motion.div
                                    key={index}
                                    variants={{
                                      hidden: { opacity: 0, y: 30, scale: 0.95 },
                                      visible: { 
                                        opacity: 1, 
                                        y: 0, 
                                        scale: 1,
                                        transition: {
                                          duration: 0.8,
                                          ease: [0.6, -0.05, 0.01, 0.99]
                                        }
                                      }
                                    }}
                                    className="group relative"
                                >
                                  <div className="flex items-start gap-6 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-green-100/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:bg-white/95 hover:border-green-200/70">
                                    <div className="relative">
                                      <div className="w-8 h-8 bg-gradient-to-br from-[#009178] to-[#00a085] rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-md group-hover:scale-110 transition-transform duration-300">
                                        {index + 1}
                                      </div>
                                      <div className="absolute -inset-1 bg-gradient-to-br from-[#009178] to-[#00a085] rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm"></div>
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-gray-700 text-base leading-relaxed">{sentence.trim()}</p>
                                    </div>
                                  </div>
                                </motion.div>
                            ))}
                      </motion.div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/*<TabsContent value="explanation">*/}
                {/*  <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">*/}
                {/*    <CardContent className="p-8">*/}
                {/*      <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">*/}
                {/*        {news.explanation}*/}
                {/*      </p>*/}
                {/*    </CardContent>*/}
                {/*  </Card>*/}
                {/*</TabsContent>*/}

                <TabsContent value="explanation">
                  <Card className="shadow-2xl border-0 bg-gradient-to-br from-white/95 via-green-50/30 to-white/95 backdrop-blur-sm rounded-3xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#009178]/5 via-transparent to-[#009178]/5"></div>
                    <CardContent className="relative p-10">
                      <div className="space-y-8">
                        {/* 섹션 헤더 */}
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#009178] to-[#00a085] rounded-2xl flex items-center justify-center shadow-lg">
                            <Lightbulb className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-gray-800">한 눈에 이해하는 핵심 설명</h2>
                            <p className="text-gray-500 text-sm">복잡한 내용을 쉽게 풀어드려요</p>
                          </div>
                        </div>

                        {/* 연속된 텍스트로 표시 */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={{
                              hidden: { opacity: 0 },
                              visible: {
                                opacity: 1,
                                transition: {
                                  staggerChildren: 0.15,
                                  delayChildren: 0.1
                                }
                              }
                            }}
                            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-green-100/50 p-8 shadow-sm"
                        >
                          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                            {news.explanation.split(/(?<=\.)\s+/).filter((line: string) => line.trim() !== "").map((line: string, idx: number) => (
                                <motion.p 
                                  key={idx} 
                                  className="mb-4 last:mb-0"
                                  variants={{
                                    hidden: { opacity: 0, x: -20 },
                                    visible: { 
                                      opacity: 1, 
                                      x: 0,
                                      transition: {
                                        duration: 0.5,
                                        ease: "easeOut"
                                      }
                                    }
                                  }}
                                >
                                  {line.trim()}
                                </motion.p>
                            ))}
                          </div>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="original">
                  <Card className="shadow-2xl border-0 bg-gradient-to-br from-white/95 via-green-50/30 to-white/95 backdrop-blur-sm rounded-3xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#009178]/5 via-transparent to-[#009178]/5"></div>
                    <CardContent className="relative p-10">
                      <div className="space-y-8">
                        {/* 섹션 헤더 */}
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#009178] to-[#00a085] rounded-2xl flex items-center justify-center shadow-lg">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-gray-800">원문 기사</h2>
                            <p className="text-gray-500 text-sm">전체 기사를 원문 그대로 확인하세요</p>
                          </div>
                        </div>

                        {/* 원문 내용 */}
                        <motion.div 
                          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-green-100/50 p-8 shadow-sm"
                          initial="hidden"
                          animate="visible"
                          variants={{
                            hidden: { opacity: 0 },
                            visible: {
                              opacity: 1,
                              transition: {
                                staggerChildren: 0.1,
                                delayChildren: 0.2
                              }
                            }
                          }}
                        >
                          <motion.div
                              className="prose max-w-none text-gray-700 leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: news.contentHtml }}
                              variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { 
                                  opacity: 1, 
                                  y: 0,
                                  transition: {
                                    duration: 0.8,
                                    ease: [0.6, -0.05, 0.01, 0.99]
                                  }
                                }
                              }}
                          />
                        </motion.div>

                        {/* 원문 링크 버튼 */}
                        <motion.div 
                          className="pt-6"
                          initial="hidden"
                          animate="visible"
                          variants={{
                            hidden: { opacity: 0 },
                            visible: {
                              opacity: 1,
                              transition: {
                                staggerChildren: 0.2,
                                delayChildren: 0.5
                              }
                            }
                          }}
                        >
                          <motion.div
                              variants={{
                                hidden: { opacity: 0, y: 30, scale: 0.95 },
                                visible: { 
                                  opacity: 1, 
                                  y: 0, 
                                  scale: 1,
                                  transition: {
                                    duration: 0.6,
                                    ease: [0.6, -0.05, 0.01, 0.99]
                                  }
                                }
                              }}
                              className="relative group"
                          >
                            <a href={news.url} target="_blank" rel="noopener noreferrer">
                              <div className="relative overflow-hidden bg-gradient-to-r from-[#009178] to-[#00a085] hover:from-[#004E42] hover:to-[#009178] text-white px-6 py-4 rounded-2xl font-semibold text-base group shadow-xl transition-all duration-300 hover:shadow-2xl">
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative flex items-center justify-center gap-2">
                                  <span>원문 사이트에서 전체 기사 보기</span>
                                  <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                                </div>
                              </div>
                            </a>
                          </motion.div>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

              </Tabs>
            </motion.div>
          </motion.div>
        </div>

        {/* 적립 완료 모달 */}
        {showRewardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowRewardModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-3xl p-8 text-center shadow-2xl border border-gray-100">
                {/* Award 뱃지와 제목/설명을 같은 라인에 배치 */}
                <motion.div 
                  className="flex items-center justify-between mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  {/* 성공 애니메이션 아이콘 */}
                  <motion.div 
                    className="relative"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 260, 
                      damping: 20,
                      delay: 0.2
                    }}
                  >
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg relative">
                      
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
                      >
                        <Award className="w-8 h-8 text-white" />
                      </motion.div>
                      
                      {/* 체크마크 오버레이 */}
                      <motion.div
                        className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.6, duration: 0.4 }}
                      >
                        <svg className="w-2.5 h-2.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* 제목과 설명 */}
                  <div className="flex-1 -ml-10 text-center">
                    <h2 className="text-xl font-bold text-gray-700 mb-1">
                      하나머니 적립 완료! 
                    </h2>
                    <p className="text-gray-600 text-sm">
                      또 다른 뉴스도 읽어볼까요?
                    </p>
                  </div>
                </motion.div>

                {/* 적립 금액 표시 */}
                <motion.div 
                  className="bg-emerald-50 rounded-2xl p-4 mb-6 border border-emerald-100"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <motion.p 
                    className="text-2xl font-bold text-emerald-600 mb-1"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                  >
                    +50P
                  </motion.p>
                  <p className="text-xs text-gray-500">하나머니가 적립되었습니다</p>
                </motion.div>

                {/* 확인 버튼 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <Button 
                    onClick={() => setShowRewardModal(false)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    확인
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
  )
}
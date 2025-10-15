"use client"

import { useEffect, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import {
  TrendingUp,
  Building2,
  DollarSign,
  Globe,
  Clock,
  Sparkles,
  Flame,
  Star,
  BookOpen,
  Newspaper,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Image from "next/image"
import React from "react"

// NewsItem 타입 명시
interface NewsItem {
  id: string
  title: string
  source: string
  time: string
  category: string
  image: string
  summary: string
  tags: string[]
  isHot: boolean
}

const newsCategories = [
  { id: "all", label: "전체", icon: Globe, color: "from-blue-500 to-indigo-600" },
  { id: "finance", label: "금융", icon: Building2, color: "from-green-500 to-emerald-600" },
  { id: "stock", label: "증권", icon: TrendingUp, color: "from-purple-500 to-violet-600" },
  { id: "economy", label: "경제", icon: DollarSign, color: "from-orange-500 to-red-600" },
]

const ITEMS_PER_PAGE = 4

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const slideInLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
}

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [newsData, setNewsData] = useState<{
    finance: NewsItem[]
    stock: NewsItem[]
    economy: NewsItem[]
    all: NewsItem[]
  }>({ finance: [], stock: [], economy: [], all: [] })

  const targetRef = React.useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  })

  const heroImageY = useTransform(scrollYProgress, [0, 1], [0, -100])
  const heroImageScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1])

  useEffect(() => {
    async function fetchNews() {
      const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

      const res = await fetch(`${BASE_URL}/api/news/recent`)

      const raw = await res.json()

      const categories = { finance: [], stock: [], economy: [], all: [] } as {
        finance: NewsItem[]
        stock: NewsItem[]
        economy: NewsItem[]
        all: NewsItem[]
      }

      raw.forEach((item: any) => {
        const mapped: NewsItem = {
          id: item.id,
          title: item.title,
          source: item.source || "출처 없음",
          time: formatDistanceToNow(new Date(item.publishedAt), {
            addSuffix: true, // (예: 5분 전)
            locale: ko,      // 한국어
          }),
          category: item.category,
          image: item.thumbnailUrl || "/placeholder.svg",
          summary: item.summary || "요약 없음",
          tags: item.tags || [],
          isHot: false,
        }

        categories.all.push(mapped)
        if (item.category === "금융") categories.finance.push(mapped)
        if (item.category === "증권") categories.stock.push(mapped)
        if (item.category === "경제 일반") categories.economy.push(mapped)
      })

      setNewsData(categories)
    }

    fetchNews()
  }, [])

  const currentNews = newsData[activeCategory as keyof typeof newsData] || []
  const totalPages = Math.ceil(currentNews.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedNews = currentNews.slice(startIndex, endIndex)

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    document.getElementById("news-content")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div ref={targetRef} className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      <div className="container mx-auto p-6 max-w-7xl">
        <motion.div initial="initial" animate="animate" variants={staggerContainer}>
          {/* Hero Section */}
          <motion.div variants={fadeInUp} className="mb-16">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#009178] via-[#00a085] to-[#004E42] rounded-3xl shadow-2xl">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width%3D%2260%22 height%3D%2260%22 viewBox%3D%220 0 60 60%22 xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg fill%3D%22none%22 fillRule%3D%22evenodd%22%3E%3Cg fill%3D%22%23ffffff%22 fillOpacity%3D%220.1%22%3E%3Ccircle cx%3D%2230%22 cy%3D%2230%22 r%3D%222%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>
              </div>

              <div className="relative p-8 lg:p-12">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  {/* Text Content */}
                  <motion.div variants={slideInLeft} className="space-y-8">
                    <div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-6"
                      >
                        <Sparkles className="w-4 h-4" />
                        세상의 돈이 어떻게 움직이는지 확인하세요
                      </motion.div>
                      <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight mb-6">금융 뉴스</h1>
                      <p className="text-xl text-white/90 leading-relaxed max-w-xl">
                      복잡한 금융 뉴스, 쉽고 재미있게! <br />청소년 눈높이에 맞춘 금융 뉴스로 세상을 보는 힘을 키워보세요!
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        size="lg"
                        className="bg-white text-[#009178] hover:bg-white/90 text-lg px-8 py-6 rounded-full font-bold group shadow-xl"
                      >
                        <BookOpen className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                        오늘의 뉴스
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="text-white border-white/30 hover:bg-white/10 text-lg px-8 py-6 rounded-full font-bold bg-transparent"
                      >
                        인기 기사
                      </Button>
                    </div>
                  </motion.div>

                  {/* Hero Image */}
                  <motion.div
                    style={{ y: heroImageY, scale: heroImageScale }}
                    className="relative lg:h-[500px] flex items-center justify-center"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                      className="relative"
                    >
                      <div className="w-80 h-80 relative">
                        <Image
                          src="/news-hero.png"
                          alt="금융 뉴스 3D 캐릭터"
                          width={320}
                          height={320}
                          className="object-contain drop-shadow-2xl"
                          priority
                        />
                      </div>
                      {/* Floating Elements */}
                      <motion.div
                        animate={{
                          y: [-10, 10, -10],
                          rotate: [-2, 2, -2],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }}
                        className="absolute -top-8 -left-8 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                      >
                        <Newspaper className="w-8 h-8 text-white" />
                      </motion.div>
                      <motion.div
                        animate={{
                          y: [10, -10, 10],
                          rotate: [2, -2, 2],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                          delay: 1,
                        }}
                        className="absolute -bottom-15 -right-12 w-16 h-16 bg-yellow-400/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                      >
                        <Star className="w-8 h-8 text-yellow-400" />
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Category Tabs */}
          <motion.div variants={fadeInUp} id="news-content">
            <Tabs value={activeCategory} onValueChange={handleCategoryChange} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-12 bg-white shadow-xl h-16 rounded-2xl p-2">
                {newsCategories.map((category) => {
                  const Icon = category.icon
                  return (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="flex flex-col items-center gap-1 data-[state=active]:bg-[#009178] data-[state=active]:text-white rounded-xl font-bold text-sm transition-all duration-300 h-full"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <span className="hidden sm:inline">{category.label}</span>
                      </div>
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {newsCategories.map((category) => (
                <TabsContent key={category.id} value={category.id} className="space-y-6">
                  <div className="space-y-8">
                    {paginatedNews.map((article, index) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        whileHover={{ y: -10, transition: { duration: 0.3 } }}
                      >
                        <Link href={`/news/${article.id}`}>
                          <Card className="hover:shadow-2xl transition-all duration-500 cursor-pointer group overflow-hidden border-0 bg-white shadow-lg">
                            <div className="grid md:grid-cols-3 gap-6 p-8">
                              {/* Image */}
                              <div className="relative overflow-hidden rounded-2xl md:col-span-1 h-48 md:h-64">
                                <motion.img
                                  src={article.image || "/placeholder.svg"}
                                  alt={article.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  whileHover={{ scale: 1.05 }}
                                />
                                {/* Badges */}
                                <div className="absolute top-3 left-3 flex flex-col gap-2">
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-white/90 backdrop-blur-sm border-white/20"
                                  >
                                    {article.category}
                                  </Badge>
                                  {article.isHot && (
                                    <Badge className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-500 hover:to-orange-500 text-xs shadow-lg">
                                      <Flame className="w-3 h-3 mr-1" />
                                      HOT
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Content */}
                              <div className="md:col-span-2 space-y-4">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="font-medium text-[#009178]">{article.source}</span>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{article.time}</span>
                                    </div>
                                  </div>
                                  <h2 className="text-2xl font-bold text-gray-800 line-clamp-2 group-hover:text-[#009178] transition-colors">
                                    {article.title}
                                  </h2>
                                  <p className="text-gray-600 text-lg leading-relaxed line-clamp-2">
                                    {article.summary}
                                  </p>
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2">
                                  {article.tags.map((tag, tagIndex) => (
                                    <motion.div key={tagIndex} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                      <Badge
                                        variant="secondary"
                                        className="text-xs bg-[#009178]/10 text-[#009178] hover:bg-[#009178]/20 cursor-pointer transition-colors"
                                      >
                                        #{tag}
                                      </Badge>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="flex justify-center items-center gap-2 mt-12"
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="rounded-xl bg-white shadow-lg border-0 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="icon"
                          onClick={() => handlePageChange(page)}
                          className={`rounded-xl shadow-lg border-0 ${
                            currentPage === page
                              ? "bg-[#009178] hover:bg-[#004E42] text-white"
                              : "bg-white hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </Button>
                      ))}

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="rounded-xl bg-white shadow-lg border-0 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

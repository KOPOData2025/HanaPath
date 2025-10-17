"use client"

import {useEffect, useRef, useState} from "react"
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { PiggyBank, Coffee, ShoppingCart, Film, Gift, Star, ShoppingBag, Search, Filter, Sparkles, Heart, Zap, Crown, Target, Coins, Wallet } from "lucide-react"
import Image from "next/image"
import React from "react"
import {
  fetchAllProducts,
  fetchProductsByCategory,
  searchProducts,
  Product
} from "@/lib/api/store"
import ProductModal from "@/components/store/product-modal"
import { useAuthStore } from "@/store/auth"
import { hanaMoneyApi } from "@/lib/api/hanamoney"
import { HanaMoneyDto } from "@/types/hanamoney"

const storeCategories = [
  { id: "all", label: "전체", icon: ShoppingBag, color: "from-blue-500 to-indigo-600"},
  { id: "cafe", label: "카페/음료", icon: Coffee, color: "from-amber-500 to-orange-600"},
  { id: "convenience", label: "편의점/마트", icon: ShoppingCart, color: "from-green-500 to-emerald-600"},
  { id: "movie", label: "영화/문화", icon: Film, color: "from-purple-500 to-violet-600"},
  { id: "etc", label: "기타", icon: Gift, color: "from-pink-500 to-rose-600"},
]

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] },
}

const itemsPerPage = 4

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

export default function StorePage() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hanaMoney, setHanaMoney] = useState<HanaMoneyDto | null>(null)
  const [hanaMoneyLoading, setHanaMoneyLoading] = useState(true)

  type Mode = "search" | "category"
  const [mode, setMode] = useState<"search" | "category">("category")
  
  const { user, isLoggedIn } = useAuthStore()

  // 카테고리 레이블 매핑
  const categoryMap: Record<string, string> = {
    cafe: "카페/음료",
    convenience: "편의점/마트",
    movie: "영화/문화",
    etc: "기타"
  }

  // 검색 useEffect 수정
  useEffect(() => {
    if (searchQuery.trim() === "") return
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const results = await searchProducts(searchQuery)

        // 현재 카테고리 범위 안에서만 결과 보여주기
        let filtered = results
        if (activeCategory !== "all") {
          const categoryName = categoryMap[activeCategory]
          filtered = results.filter((p) => p.category === categoryName)
        }

        setProducts(filtered)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
        setCurrentPage(1)
      }
    }
    const delay = setTimeout(fetchProducts, 300)
    return () => clearTimeout(delay)
  }, [searchQuery])

  useEffect(() => {
    if (mode !== "category") return

    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        if (activeCategory === "all") {
          const results = await fetchAllProducts()
          setProducts(results)
        } else {
          const categoryMap: Record<string, string> = {
            cafe: "카페/음료",
            convenience: "편의점/마트",
            movie: "영화/문화",
            etc: "기타"
          }
          const categoryName = categoryMap[activeCategory]
          const results = await fetchProductsByCategory(categoryName)
          setProducts(results)
        }
        setCurrentPage(1)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [activeCategory, mode])

  // useEffect(() => {
  //   window.scrollTo({ top: 0, behavior: "smooth" })
  // }, [currentPage])

  const targetRef = React.useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  })

  // 탭 클릭 시
  const handleCategoryChange = (newCategory: string) => {
    setMode("category")
    setSearchQuery("")
    setActiveCategory(newCategory)
  }

  const heroImageY = useTransform(scrollYProgress, [0, 1], [0, -100])
  const heroImageScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1])

  // 페이지네이션 계산 함수
  const getVisiblePages = (current: number, total: number, maxVisible: number = 5) => {
    const half = Math.floor(maxVisible / 2)
    let start = Math.max(current - half, 1)
    let end = start + maxVisible - 1

    if (end > total) {
      end = total
      start = Math.max(end - maxVisible + 1, 1)
    }

    const pages = []
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  const [prevPage, setPrevPage] = useState(1)
  const pagesPerGroup = 5 // 한 번에 보여줄 페이지 수
  const currentGroup = Math.floor((currentPage - 1) / pagesPerGroup)
  const prevGroup = Math.floor((prevPage - 1) / pagesPerGroup)
  const isGroupChanged = currentGroup !== prevGroup
  const isForward = currentPage > prevPage

  // 상품 선택 및 모달 오픈 상태 추가
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 상품 클릭 시 핸들러
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  // 하나머니 데이터 로드
  useEffect(() => {
    const loadHanaMoney = async () => {
      if (!isLoggedIn || !user?.id) {
        setHanaMoneyLoading(false)
        return
      }

      try {
        setHanaMoneyLoading(true)
        const response = await hanaMoneyApi.getHanaMoney()
        if (response.data) {
          setHanaMoney(response.data)
        }
      } catch (error) {
        console.error("하나머니 데이터 로드 실패:", error)
      } finally {
        setHanaMoneyLoading(false)
      }
    }

    loadHanaMoney()
  }, [isLoggedIn, user?.id])



  useEffect(() => {
    setPrevPage(currentPage)
  }, [currentPage])

  return (
      <div ref={targetRef} className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
        <div className="container mx-auto p-6 max-w-7xl">
          <motion.div initial="initial" animate="animate" variants={staggerContainer}>
            {/* Hero Section */}
            <motion.div variants={fadeInUp} className="mb-16">
              <div
                  className="relative overflow-hidden bg-gradient-to-br from-[#009178] via-[#00a085] to-[#004E42] rounded-3xl shadow-2xl">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div
                      className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width%3D%2260%22 height%3D%2260%22 viewBox%3D%220 0 60 60%22 xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg fill%3D%22none%22 fillRule%3D%22evenodd%22%3E%3Cg fill%3D%22%23ffffff%22 fillOpacity%3D%220.1%22%3E%3Ccircle cx%3D%2230%22 cy%3D%2230%22 r%3D%222%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>
                </div>

                <div className="relative p-8 lg:p-12">
                  <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Text Content */}
                    <motion.div variants={slideInLeft} className="space-y-8">
                      <div>
                        <motion.div
                            initial={{opacity: 0, scale: 0.8}}
                            animate={{opacity: 1, scale: 1}}
                            transition={{duration: 0.6, delay: 0.2}}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-6"
                        >
                          <Sparkles className="w-4 h-4"/>
                          하나머니로 구매하는 특별한 혜택
                        </motion.div>
                        <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight mb-6">리워드 스토어</h1>
                        <p className="text-xl text-white/90 leading-relaxed max-w-lg">
                          학습하고 모은 하나머니로 다양한 기프티콘을 구매하세요. <br />특별한 할인 혜택도 놓치지 마세요!
                        </p>
                      </div>

                      <div
                          className="flex items-center gap-6 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                        <div
                            className="w-16 h-16 bg-yellow-400/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                          <PiggyBank className="w-8 h-8 text-yellow-400"/>
                        </div>
                        <div>
                          <p className="text-white/70 text-sm font-medium">보유 하나머니</p>
                          {hanaMoneyLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                              <p className="text-lg text-yellow-400">로딩 중...</p>
                            </div>
                          ) : (
                            <p className="text-4xl font-black text-yellow-400">
                              {hanaMoney ? parseFloat(hanaMoney.balance).toLocaleString() : '0'} P
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Hero Image */}
                    <motion.div
                        style={{y: heroImageY, scale: heroImageScale}}
                        className="relative lg:h-[500px] flex items-center justify-center"
                    >
                      <motion.div
                          initial={{opacity: 0, scale: 0.8, rotate: -5}}
                          animate={{opacity: 1, scale: 1, rotate: 0}}
                          transition={{duration: 1, delay: 0.3, ease: "easeOut"}}
                          className="relative"
                      >
                        <div className="w-[28rem] h-[28rem] relative">
                          <Image
                              src="/store-icon.png"
                              alt="리워드 스토어"
                              width={448}
                              height={448}
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
                          <Gift className="w-8 h-8 text-white"/>
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
                            className="absolute -bottom-3 -right-10 w-20 h-20 bg-orange-400/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                        >
                          {/* <Wallet className="w-9 h-9 text-white" /> */}
                          <Wallet className="w-9 h-9 text-orange-500"/>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Search and Filter */}
            <motion.div variants={fadeInUp} className="mb-12">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                  <Input
                      placeholder="원하는 상품 또는 브랜드를 검색해보세요!"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setMode("search");
                      }}
                      className="pl-12 h-12 bg-white shadow-lg border-0 rounded-2xl text-base focus:ring-2 focus:ring-[#009178]/20"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="rounded-xl bg-white shadow-lg border-0 hover:bg-gray-50">
                    <Filter className="w-4 h-4 mr-2"/>
                    필터
                  </Button>
                  <Button variant="outline" className="rounded-xl bg-white shadow-lg border-0 hover:bg-gray-50">
                    <Target className="w-4 h-4 mr-2"/>
                    정렬
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Category Tabs */}
            <motion.div variants={fadeInUp}>
              <Tabs value={activeCategory} onValueChange={handleCategoryChange} className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-12 bg-white shadow-xl h-16 rounded-2xl p-2">
                  {storeCategories.map((category) => {
                    const Icon = category.icon
                    return (
                        <TabsTrigger
                            key={category.id}
                            value={category.id}
                            className="flex flex-col items-center gap-1 data-[state=active]:bg-[#009178] data-[state=active]:text-white rounded-xl font-bold text-sm transition-all duration-300 h-full"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-5 h-5"/>
                            <span className="hidden sm:inline">{category.label}</span>
                          </div>
                        </TabsTrigger>
                    )
                  })}
                </TabsList>

                {storeCategories.map((category) => {
                  if (category.id !== activeCategory) return null

                  const categoryMap: Record<string, string> = {
                    cafe: "카페/음료",
                    convenience: "편의점/마트",
                    movie: "영화/문화",
                    etc: "기타"
                  }

                  const filtered = products

                  const totalPages = Math.ceil(filtered.length / itemsPerPage)
                  const paged = filtered.slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage
                  )

                  return (
                      <TabsContent key={category.id} value={category.id} className="space-y-6">
                        {isLoading ? (
                            <p className="text-center text-gray-400 py-10">상품을 불러오는 중입니다...</p>
                        ) : paged.length === 0 ? (
                            <p className="text-center text-gray-400 py-10">상품이 없습니다.</p>
                        ) : (
                            <>
                              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {paged.map((product, index) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{opacity: 0, y: 30}}
                                        animate={{opacity: 1, y: 0}}
                                        transition={{duration: 0.6, delay: index * 0.2}}
                                        whileHover={{y: -10, transition: {duration: 0.3}}}
                                    >
                                      <Card onClick={() => handleProductClick(product)}
                                          className="h-full hover:shadow-2xl transition-all duration-500 group cursor-pointer overflow-hidden border-0 bg-white shadow-lg">
                                        <div className="relative overflow-hidden">
                                          <img
                                              src={`data:image/jpeg;base64,${product.imageBase64}`}
                                              alt={product.name}
                                              className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                                          />
                                          <div className="absolute top-3 left-3 flex flex-col gap-2">
                                            {product.discount > 0 && (
                                                <Badge
                                                    className="bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                                                  {product.discount}% 할인
                                                </Badge>
                                            )}
                                          </div>

                                          <Badge
                                              className="absolute top-3 right-3 bg-white/90 text-gray-700 shadow-lg backdrop-blur-sm hover:bg-white/90 hover:text-gray-700"
                                          >
                                            {product.brand}
                                          </Badge>

                                        </div>

                                        <CardContent className="p-6">
                                          <div className="space-y-4">
                                            <h3 className="text-lg font-bold line-clamp-2 group-hover:text-[#009178] transition-colors min-h-[3.5rem]">
                                              {product.name}
                                            </h3>
                                            <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-[#009178]">
                          {product.price.toLocaleString()} P
                        </span>
                                              {product.originalPrice && (
                                                  <span className={`text-sm text-gray-500 ${product.originalPrice !== product.price ? 'line-through' : ''}`}>
                            {product.originalPrice.toLocaleString()} P
                          </span>
                                              )}
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </motion.div>
                                ))}
                              </div>

                              {/* 페이지네이션 버튼 */}
                              {totalPages > 1 && (
                                  <div className="flex justify-center gap-2 mt-10 mb-16">
                                    <Button
                                        className="h-9 px-4 rounded-xl shadow"
                                        variant="ghost"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                    >
                                      ← 이전
                                    </Button>

                                    <AnimatePresence mode="wait">
                                      <motion.div
                                          key={getVisiblePages(currentPage, totalPages).join("-")}
                                          initial={
                                            isGroupChanged
                                                ? { opacity: 0, x: isForward ? 60 : -60, scale: 0.95 }
                                                : { opacity: 0 }
                                          }
                                          animate={{ opacity: 1, x: 0, scale: 1 }}
                                          exit={
                                            isGroupChanged
                                                ? { opacity: 0, x: isForward ? -60 : 60, scale: 0.95 }
                                                : { opacity: 0 }
                                          }
                                          transition={{
                                            duration: isGroupChanged ? 0.4 : 0.2,
                                            ease: [0.22, 1, 0.36, 1],
                                          }}
                                          className="flex gap-2"
                                      >

                                      {getVisiblePages(currentPage, totalPages).map((page) => (
                                            <Button
                                                key={page}
                                                className={`h-9 px-4 rounded-xl shadow transition-all duration-300 ${
                                                    currentPage === page
                                                        ? 'bg-[#009178] text-white scale-[1.05]'
                                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                                }`}
                                                variant="ghost"
                                                onClick={() => setCurrentPage(page)}
                                            >
                                              {page}
                                            </Button>
                                        ))}
                                      </motion.div>
                                    </AnimatePresence>

                                    <Button
                                        className="h-9 px-4 rounded-xl shadow"
                                        variant="ghost"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                    >
                                      다음 →
                                    </Button>
                                  </div>
                              )}
                            </>
                        )}
                      </TabsContent>
                  )
                })}
              </Tabs>

              {/* 모달 컴포넌트 삽입 위치 */}
              {selectedProduct && (
                  <ProductModal
                      product={selectedProduct}
                      isOpen={isModalOpen}
                      onClose={() => setIsModalOpen(false)}
                  />
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/auth"
import { fetchUserValidGifticons, fetchUserExpiredGifticons, useGifticon } from "@/lib/api/store"
import {
  Gift,
  Calendar,
  Clock,
  QrCode,
  Share2,
  Download,
  X,
} from "lucide-react"

interface GiftCard {
  id: number
  productName: string
  productBrand: string
  totalPrice: number
  purchaseDate: string
  expiryDate: string
  status: 'PURCHASED' | 'EXPIRED' | 'USED' | 'REFUNDED'
  giftCode: string
  isUsed: boolean
}

export default function GiftCardsTab() {
  const { user } = useAuthStore()
  const [selectedGiftCard, setSelectedGiftCard] = useState<GiftCard | null>(null)
  const [availableGiftCards, setAvailableGiftCards] = useState<GiftCard[]>([])
  const [expiredGiftCards, setExpiredGiftCards] = useState<GiftCard[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 실제 구매 내역 로드
  useEffect(() => {
    const loadGiftCards = async () => {
      if (!user?.id) return
      
      try {
        setIsLoading(true)
        const [validCards, expiredCards] = await Promise.all([
          fetchUserValidGifticons(user.id),
          fetchUserExpiredGifticons(user.id)
        ])
        
        setAvailableGiftCards(validCards)
        setExpiredGiftCards(expiredCards)
      } catch (error) {
        console.error("기프티콘 로드 실패:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadGiftCards()
  }, [user?.id])

  const handleUseGiftCard = async (giftCard: GiftCard) => {
    if (!user?.id) return
    
    try {
      await useGifticon(giftCard.id, user.id)
      // 사용 후 목록 새로고침
      const [validCards, expiredCards] = await Promise.all([
        fetchUserValidGifticons(user.id),
        fetchUserExpiredGifticons(user.id)
      ])
      setAvailableGiftCards(validCards)
      setExpiredGiftCards(expiredCards)
      setSelectedGiftCard(null)
    } catch (error) {
      console.error("기프티콘 사용 실패:", error)
    }
  }

  return (
    <>
      {/* 사용 가능한 기프티콘 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-2xl border-b-0">
            <CardTitle className="flex items-center gap-3 text-xl">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-600 rounded-xl flex items-center justify-center shadow-md"
              >
                <Gift className="w-5 h-5 text-white" />
              </motion.div>
              사용 가능한 기프티콘
              <Badge className="bg-gradient-to-r from-teal-600 to-teal-600 hover:from-teal-700 hover:to-teal-700 text-white px-3 py-1 text-sm font-medium shadow-md">
                {availableGiftCards.length}개
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-slate-600">기프티콘을 불러오는 중...</p>
              </div>
            ) : availableGiftCards.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {availableGiftCards.map((giftCard, index) => (
                  <motion.div
                    key={giftCard.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.01 }}
                  >
                    <Card className="hover:shadow-xl transition-all duration-300 group cursor-pointer border-0 overflow-hidden bg-gradient-to-br from-white to-slate-50">
                      <div className="relative overflow-hidden">
                        <div className="w-full h-40 bg-gradient-to-br from-teal-100 to-teal-100 flex items-center justify-center">
                          <Gift className="w-16 h-16 text-teal-600" />
                        </div>
                        <Badge className="absolute top-3 right-3 bg-gradient-to-r from-teal-600 to-teal-600 hover:from-teal-700 hover:to-teal-700 shadow-lg text-white font-medium text-xs">
                          {giftCard.status === 'PURCHASED' ? '사용가능' : giftCard.status}
                        </Badge>
                      </div>
                      <CardContent className="p-5">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-medium text-lg line-clamp-2 group-hover:text-teal-600 transition-colors">
                              {giftCard.productName}
                            </h3>
                            <p className="text-sm text-slate-500 font-medium mt-1">{giftCard.productBrand}</p>
                          </div>
                          <div className="flex items-center justify-between text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>~{new Date(giftCard.expiryDate).toLocaleDateString()}</span>
                            </div>
                            <span className="font-bold text-teal-600 text-lg">
                              {giftCard.totalPrice.toLocaleString()}원
                            </span>
                          </div>
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              size="sm"
                              className="w-full bg-gradient-to-r from-teal-600 to-teal-600 hover:from-teal-700 hover:to-teal-700 rounded-lg font-medium shadow-md"
                              onClick={() => setSelectedGiftCard(giftCard)}
                            >
                              <QrCode className="w-4 h-4 mr-2" />
                              상세보기
                            </Button>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-md">
                  <Gift className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">보유한 기프티콘이 없습니다</h3>
                <p className="text-slate-600 mb-6 text-lg">스토어에서 기프티콘을 구매해보세요!</p>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button className="bg-gradient-to-r from-teal-600 to-teal-600 hover:from-teal-700 hover:to-teal-700 px-8 py-3 rounded-lg font-medium shadow-md">
                    <Gift className="w-5 h-5 mr-2" />
                    스토어 바로가기
                  </Button>
                </motion.div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* 만료된 기프티콘 */}
      {expiredGiftCards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-stone-50 rounded-t-2xl border-b-0">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-600 rounded-xl flex items-center justify-center shadow-md">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                만료된 기프티콘
                <Badge variant="outline" className="px-3 py-1 text-sm font-medium border-slate-300">
                  {expiredGiftCards.length}개
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {expiredGiftCards.map((giftCard, index) => (
                  <motion.div
                    key={giftCard.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="opacity-60 border-0 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
                      <div className="relative overflow-hidden">
                        <div className="w-full h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center grayscale">
                          <Gift className="w-16 h-16 text-slate-400" />
                        </div>
                        <Badge className="absolute top-3 right-3 bg-slate-500 hover:bg-slate-500 shadow-md text-white font-medium text-xs">
                          만료됨
                        </Badge>
                      </div>
                      <CardContent className="p-5">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-medium text-lg line-clamp-2 text-slate-600">
                              {giftCard.productName}
                            </h3>
                            <p className="text-sm text-slate-400 font-medium mt-1">{giftCard.productBrand}</p>
                          </div>
                          <div className="flex items-center justify-between text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>만료: {new Date(giftCard.expiryDate).toLocaleDateString()}</span>
                            </div>
                            <span className="font-bold text-lg">{giftCard.totalPrice.toLocaleString()}원</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 기프티콘 사용 모달 */}
      <AnimatePresence>
        {selectedGiftCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-200/20 to-stone-200/20 rounded-full -translate-y-12 translate-x-12" />

              <div className="text-center space-y-5 relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                  <QrCode className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{selectedGiftCard.productName}</h3>
                  <p className="text-slate-600 font-medium">{selectedGiftCard.productBrand}</p>
                  <p className="text-2xl font-black text-slate-700 mt-2">
                    {selectedGiftCard.totalPrice.toLocaleString()}원
                  </p>
                </div>

                {/* 기프티콘 코드 영역 */}
                <div className="bg-gradient-to-br from-slate-50 to-stone-50 p-5 rounded-xl shadow-inner">
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="text-center">
                      <div className="font-mono text-lg font-bold mb-3 text-slate-800">{selectedGiftCard.giftCode}</div>
                      <div className="h-12 bg-gradient-to-r from-slate-100 to-stone-100 rounded-md flex items-center justify-center shadow-inner">
                        <span className="text-sm text-slate-500 font-medium">기프티콘 코드</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-slate-500 space-y-1 bg-slate-50 p-4 rounded-lg">
                  <p className="font-medium">유효기간: {new Date(selectedGiftCard.expiryDate).toLocaleDateString()}까지</p>
                  <p className="font-medium">구매일: {new Date(selectedGiftCard.purchaseDate).toLocaleDateString()}</p>
                </div>

                <div className="flex gap-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full rounded-lg font-medium border border-slate-300 bg-transparent hover:bg-slate-50 py-2.5 text-sm"
                      onClick={() => setSelectedGiftCard(null)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      닫기
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button 
                      className="w-full bg-gradient-to-r from-teal-600 to-teal-600 hover:from-teal-700 hover:to-teal-700 rounded-lg font-medium py-2.5 shadow-md text-sm"
                      onClick={() => handleUseGiftCard(selectedGiftCard)}
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      사용하기
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 
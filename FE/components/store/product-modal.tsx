"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, BadgePercent, CalendarDays, Info, AlertCircle, MoreHorizontal, CreditCard, Wallet, Coins, CheckCircle, ChevronRight, Lock } from "lucide-react"
import { Product } from "@/lib/api/store"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { useRef, useEffect, useState } from "react"
import { useAuthStore } from "@/store/auth"
import { hanaMoneyApi } from "@/lib/api/hanamoney"
import { HanaMoneyDto } from "@/types/hanamoney"
import { useToast } from "@/hooks/use-toast"
import { purchaseProduct } from "@/lib/api/store"
import { toast as sonnerToast } from "sonner"

interface ProductModalProps {
    product: Product
    isOpen: boolean
    onClose: () => void
}

export default function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
    const [isTextTruncated, setIsTextTruncated] = useState(false)
    const [showPurchaseModal, setShowPurchaseModal] = useState(false)
    const [hanaMoney, setHanaMoney] = useState<HanaMoneyDto | null>(null)
    const [useHanaMoney, setUseHanaMoney] = useState(false)
    const [hanaMoneyAmount, setHanaMoneyAmount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [password, setPassword] = useState("")
    const [isPasswordLoading, setIsPasswordLoading] = useState(false)
    const textRef = useRef<HTMLHeadingElement>(null)
    const { user, isLoggedIn } = useAuthStore()
    const { toast } = useToast()
    


    const totalPrice = product.price
    const hanaMoneyBalance = hanaMoney ? parseFloat(hanaMoney.balance) : 0
    const maxHanaMoneyToUse = Math.min(hanaMoneyBalance, totalPrice)
    const walletAmount = totalPrice - hanaMoneyAmount

    useEffect(() => {
        if (textRef.current) {
            const element = textRef.current
            setIsTextTruncated(element.scrollHeight > element.clientHeight)
        }
    }, [product.name])

    // 하나머니 정보 로드
    useEffect(() => {
        const loadHanaMoney = async () => {
            if (!isLoggedIn || !user?.id) return

            try {
                const response = await hanaMoneyApi.getHanaMoney()
                if (response.data) {
                    setHanaMoney(response.data)
                }
            } catch (error) {
                console.error("하나머니 정보 로드 실패:", error)
            }
        }

        loadHanaMoney()
    }, [isLoggedIn, user?.id])

    // 하나머니 사용 옵션이 변경될 때 슬라이더 값 초기화
    useEffect(() => {
        if (useHanaMoney) {
            setHanaMoneyAmount(Math.min(hanaMoneyBalance, totalPrice))
        } else {
            setHanaMoneyAmount(0)
        }
    }, [useHanaMoney, hanaMoneyBalance, totalPrice])

    const handlePurchaseClick = () => {
        if (!isLoggedIn) {
            toast({
                title: "로그인 필요",
                description: "구매를 위해 로그인이 필요합니다.",
                variant: "destructive",
            })
            return
        }
        setShowPurchaseModal(true)
    }

    const handlePurchaseConfirm = async () => {
        if (!user?.id) return

        // 비밀번호 입력 모달 열기
        setShowPasswordModal(true)
    }

    const handlePasswordConfirm = async () => {
        if (!user?.id || password.length !== 4) {
            return;
        }

        // 토큰 확인
        const token = localStorage.getItem('access_token')
        
        if (!token) {
            toast({
                title: "로그인 필요",
                description: "다시 로그인해주세요.",
                variant: "destructive",
            })
            return
        }

        setIsPasswordLoading(true)
        try {
            const purchaseData = {
                productId: product.id,
                userId: user.id,
                quantity: 1,
                paymentMethod: useHanaMoney ? "hanaMoney" : "wallet",
                useHanaMoney: useHanaMoney,
                hanaMoneyAmount: hanaMoneyAmount,
                walletPassword: password
            };
            
            await purchaseProduct(purchaseData)

            // 프론트엔드에서도 추가 지연
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 추가 지연
            
            // 간단한 성공 토스트
            sonnerToast.success(product.name, {
                description: "구매가 완료되었습니다!",
                duration: 4000,
                className: "border-l-4 border-l-green-500",
            })
            setShowPasswordModal(false)
            setShowPurchaseModal(false)
            setPassword("")
            onClose()
            // 하나머니 정보 새로고침
            const hanaMoneyResponse = await hanaMoneyApi.getHanaMoney()
            if (hanaMoneyResponse.data) {
                setHanaMoney(hanaMoneyResponse.data)
            }
        } catch (error: any) {
            console.error("구매 실패:", error)
            
            // 비밀번호 에러인지 확인
            const errorMessage = error.response?.data?.message || error.message || "구매 중 오류가 발생했습니다."
            const isPasswordError = errorMessage.includes("비밀번호가 일치하지 않습니다")
            
            sonnerToast.error(isPasswordError ? "비밀번호가 일치하지 않습니다" : "구매에 실패했습니다", {
                description: (
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">
                                    {isPasswordError ? "비밀번호를 다시 입력해주세요" : "잠시 후 다시 시도해주세요"}
                                </p>
                            </div>
                        </div>
                    </div>
                ),
                duration: 4000,
                className: "border-l-4 border-l-red-500",
            })
            
            // 비밀번호 에러인 경우 비밀번호 초기화
            if (isPasswordError) {
                setPassword("")
            }
        } finally {
            setIsPasswordLoading(false)
        }
    }

    const handleNumberClick = (num: string) => {
        if (password.length < 4) {
            setPassword(password + num)
        }
    }

    const handleBackspace = () => {
        setPassword(password.slice(0, -1))
    }

    const handleClear = () => {
        setPassword("")
    }

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] p-6 relative mx-4 flex flex-col"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", stiffness: 800, damping: 40, duration: 0.2 }}
                        >

                        {/* 닫기 버튼 */}
                            <button 
                                onClick={onClose} 
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors duration-200 group"
                            >
                                <X className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300 ease-in-out" />
                            </button>

                            {/* 상단 정보 (이미지 + 텍스트) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-shrink-0">
                                <div className="w-full h-60 rounded-xl overflow-hidden shadow">
                                    <img
                                        src={`data:image/jpeg;base64,${product.imageBase64}`}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className="space-y-4 pr-8">
                                    {isTextTruncated ? (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="cursor-default hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors duration-200">
                                                        <h2 ref={textRef} className="text-xl font-bold text-gray-800 leading-tight line-clamp-2">
                                                            {product.name}
                                                        </h2>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    <p className="text-sm">{product.name}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ) : (
                                        <h2 ref={textRef} className="text-xl font-bold text-gray-800 leading-tight line-clamp-2">
                                            {product.name}
                                        </h2>
                                    )}
                                    <p className="text-sm text-gray-500">{product.brand} | {product.category}</p>
                                    <div className="flex items-center gap-4 text-[#009178] text-xl font-extrabold">
                                        {product.price.toLocaleString()} P
                                        {product.originalPrice && (
                                            <span className={`text-sm text-gray-400 ${product.originalPrice !== product.price ? 'line-through' : ''}`}>
                {product.originalPrice.toLocaleString()} P
              </span>
                                        )}
                                    </div>
                                    {product.discount > 0 && (
                                        <div className="flex items-center text-amber-600 gap-2">
                                            <BadgePercent className="w-5 h-5" />
                                            <span>{product.discount}% 할인</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <CalendarDays className="w-5 h-5" />
                                        <span>유효기간: {product.validDays}일</span>
                                    </div>
                                </div>
                            </div>

                            {/* 스크롤 영역 */}
                            <div className="overflow-y-auto mt-6 space-y-6 pr-1 flex-1">
                                {/* 설명 */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-gray-700 font-semibold">
                                        <Info className="w-5 h-5" />
                                        <span>상품 상세 정보</span>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-loose whitespace-pre-wrap max-w-prose mx-auto">
                                        {product.description}
                                    </p>

                                </div>

                                {/* 유의사항 */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-red-600 font-semibold">
                                        <AlertCircle className="w-5 h-5" />
                                        <span>유의사항</span>
                                    </div>
                                    <ul className="text-sm text-gray-600 list-disc pl-5 space-y-2 max-w-prose leading-relaxed mx-auto">
                                        <li>상품 이미지는 예시이며 실제와 다를 수 있습니다.</li>
                                        <li>유효기간 내 미사용 시 자동 소멸될 수 있습니다.</li>
                                        <li>환불 및 교환은 브랜드 정책에 따릅니다.</li>
                                    </ul>
                                </div>

                                {/* 구매 버튼 */}
                                <div className="text-right">
                                    <Button 
                                        size="lg" 
                                        className="bg-[#009178] text-white hover:bg-[#007b63] px-8 rounded-xl"
                                        onClick={handlePurchaseClick}
                                    >
                                        구매하기
                                    </Button>
                                </div>
                            </div>
                        </motion.div>

                    </motion.div>
                )}
            </AnimatePresence>

            {/* 구매 모달 */}
            <AnimatePresence>
                {showPurchaseModal && (
                    <motion.div
                        className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative mx-4"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", stiffness: 800, damping: 40 }}
                        >
                            {/* 닫기 버튼 */}
                            <button 
                                onClick={() => setShowPurchaseModal(false)} 
                                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* 헤더 */}
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#009178] to-[#007b63] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <CreditCard className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">결제 방법 선택</h3>
                                <p className="text-gray-600">원하는 결제 방법을 선택해주세요</p>
                            </div>

                            {/* 상품 정보 */}
                            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={`data:image/jpeg;base64,${product.imageBase64}`}
                                        alt={product.name}
                                        className="w-12 h-12 rounded-lg object-cover"
                                    />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-800 text-sm line-clamp-1">{product.name}</h4>
                                        <p className="text-gray-500 text-xs">{product.brand}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-[#009178]">{product.price.toLocaleString()} P</p>
                                    </div>
                                </div>
                            </div>

                            {/* 하나머니 사용 옵션 */}
                            <div className="space-y-3 mb-6">
                                <div 
                                    className="flex items-center justify-between p-3 border-2 border-gray-100 rounded-xl hover:border-[#009178]/30 transition-colors cursor-pointer"
                                    onClick={() => setUseHanaMoney(!useHanaMoney)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                            useHanaMoney ? 'border-[#009178] bg-[#009178]' : 'border-gray-300'
                                        }`}>
                                            {useHanaMoney && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Coins className="w-4 h-4 text-[#009178]" />
                                            <span className="font-medium text-sm">하나머니 사용</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-600">보유: {hanaMoneyBalance.toLocaleString()} P</p>
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {useHanaMoney && (
                                        <motion.div 
                                            className="bg-[#009178]/5 rounded-xl p-3 space-y-3 overflow-hidden"
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -5, scale: 0.98 }}
                                            transition={{ 
                                                duration: 0.25, 
                                                ease: [0.4, 0.0, 0.2, 1] 
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-gray-700">사용할 하나머니</span>
                                                <span className="text-xs text-[#009178] font-semibold">
                                                    {hanaMoneyAmount.toLocaleString()} P
                                                </span>
                                            </div>
                                            
                                            {/* 입력 필드 */}
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={maxHanaMoneyToUse}
                                                        value={hanaMoneyAmount}
                                                        onChange={(e) => {
                                                            const value = parseInt(e.target.value) || 0
                                                            setHanaMoneyAmount(Math.min(value, maxHanaMoneyToUse))
                                                        }}
                                                        className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#009178]/20 focus:border-[#009178] outline-none"
                                                        placeholder="사용할 금액 입력"
                                                    />
                                                    <Button
                                                        onClick={() => setHanaMoneyAmount(maxHanaMoneyToUse)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="px-3 py-1.5 text-xs border-[#009178] text-[#009178] hover:bg-[#009178] hover:text-white transition-colors"
                                                    >
                                                        전액
                                                    </Button>
                                                </div>
                                                
                                                {/* 빠른 선택 버튼들 */}
                                                <div className="flex gap-1.5 flex-wrap">
                                                    <Button
                                                        onClick={() => setHanaMoneyAmount(Math.min(1000, maxHanaMoneyToUse))}
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs px-2 py-1 border-gray-300 text-gray-600 hover:bg-gray-50"
                                                    >
                                                        1,000P
                                                    </Button>
                                                    <Button
                                                        onClick={() => setHanaMoneyAmount(Math.min(5000, maxHanaMoneyToUse))}
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs px-2 py-1 border-gray-300 text-gray-600 hover:bg-gray-50"
                                                    >
                                                        5,000P
                                                    </Button>
                                                    <Button
                                                        onClick={() => setHanaMoneyAmount(Math.min(10000, maxHanaMoneyToUse))}
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs px-2 py-1 border-gray-300 text-gray-600 hover:bg-gray-50"
                                                    >
                                                        10,000P
                                                    </Button>
                                                    <Button
                                                        onClick={() => setHanaMoneyAmount(Math.min(50000, maxHanaMoneyToUse))}
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs px-2 py-1 border-gray-300 text-gray-600 hover:bg-gray-50"
                                                    >
                                                        50,000P
                                                    </Button>
                                                </div>
                                            </div>
                                            
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>사용 가능: 0 P</span>
                                                <span>최대: {maxHanaMoneyToUse.toLocaleString()} P</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* 결제 금액 요약 */}
                                <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">상품 금액</span>
                                        <span className="font-medium">{totalPrice.toLocaleString()} P</span>
                                    </div>
                                    {useHanaMoney && hanaMoneyAmount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">하나머니 사용</span>
                                            <span className="text-[#009178] font-medium">-{hanaMoneyAmount.toLocaleString()} P</span>
                                        </div>
                                    )}
                                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                                        <span>총 결제 금액</span>
                                        <span className="text-[#009178]">
                                            {walletAmount.toLocaleString()} P
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 결제 버튼 */}
                            <Button
                                onClick={handlePurchaseConfirm}
                                disabled={isLoading || (useHanaMoney && hanaMoneyAmount > hanaMoneyBalance)}
                                className="w-full bg-[#009178] hover:bg-[#007b63] text-white font-semibold py-4 rounded-2xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        결제 중...
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <span>결제하기</span>
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                )}
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 비밀번호 입력 모달 */}
            <Sheet open={showPasswordModal} onOpenChange={setShowPasswordModal}>
                <SheetContent 
                    side="right" 
                    className="w-[400px] sm:w-[540px]" 
                    style={{ zIndex: 9999 }}
                >
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5" />
                            전자지갑 비밀번호 입력
                        </SheetTitle>
                    </SheetHeader>
                    
                    <div className="mt-8 space-y-8">
                        {/* 상품 정보 */}
                        <div className="bg-gray-50 rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <img
                                    src={`data:image/jpeg;base64,${product.imageBase64}`}
                                    alt={product.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800 text-sm line-clamp-1">{product.name}</h4>
                                    <p className="text-gray-500 text-xs">{product.brand}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-[#009178]">{walletAmount.toLocaleString()} P</p>
                                </div>
                            </div>
                        </div>

                        {/* 비밀번호 입력 상태 */}
                        <div className="text-center space-y-4">
                            <div className="text-sm text-gray-500">
                                전자지갑 비밀번호 ({password.length}/4)
                            </div>
                            <div className="flex gap-2 justify-center">
                                {[0, 1, 2, 3].map((index) => (
                                    <div
                                        key={index}
                                        className={`w-4 h-4 rounded-full border-2 transition-all ${
                                            index < password.length ? 'bg-[#009178] border-[#009178]' : 'border-gray-300'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* 키패드 */}
                        <div className="flex justify-center">
                            <div className="grid grid-cols-3 gap-4">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <motion.button
                                        key={num}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            handleNumberClick(num.toString())
                                            if (navigator.vibrate) {
                                                navigator.vibrate(50)
                                            }
                                        }}
                                        className="w-16 h-16 bg-white border-2 border-gray-200 rounded-xl text-xl font-semibold hover:bg-slate-50 hover:border-slate-400 hover:shadow-lg active:bg-slate-100 transition-all"
                                    >
                                        {num}
                                    </motion.button>
                                ))}
                                
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        handleClear()
                                        if (navigator.vibrate) {
                                            navigator.vibrate(100)
                                        }
                                    }}
                                    className="w-16 h-16 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium hover:bg-red-50 hover:border-red-300 hover:shadow-lg active:bg-red-100 transition-all"
                                >
                                    Clear
                                </motion.button>
                                
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        handleNumberClick("0")
                                        if (navigator.vibrate) {
                                            navigator.vibrate(50)
                                        }
                                    }}
                                    className="w-16 h-16 bg-white border-2 border-gray-200 rounded-xl text-xl font-semibold hover:bg-slate-50 hover:border-slate-400 hover:shadow-lg active:bg-slate-100 transition-all"
                                >
                                    0
                                </motion.button>
                                
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        handleBackspace()
                                        if (navigator.vibrate) {
                                            navigator.vibrate(30)
                                        }
                                    }}
                                    className="w-16 h-16 bg-white border-2 border-gray-200 rounded-xl text-lg font-medium hover:bg-orange-50 hover:border-orange-300 hover:shadow-lg active:bg-orange-100 transition-all flex items-center justify-center"
                                >
                                    ⌫
                                </motion.button>
                            </div>
                        </div>

                        {/* 결제 버튼 */}
                        <div className="text-center space-y-4">
                            <Button
                                onClick={handlePasswordConfirm}
                                disabled={password.length !== 4 || isPasswordLoading}
                                className="w-full bg-[#009178] hover:bg-[#007b63] text-white font-semibold py-4 rounded-2xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPasswordLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        결제 중...
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <span>결제하기</span>
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                )}
                            </Button>
                            
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowPasswordModal(false)
                                    setPassword("")
                                }}
                                className="w-full rounded-2xl text-lg font-semibold"
                            >
                                취소
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
}

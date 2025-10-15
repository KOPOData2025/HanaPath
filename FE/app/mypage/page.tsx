"use client"

import { useState, useEffect, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Gift, Settings, Clover } from "lucide-react"
import { motion } from "framer-motion"
import { Sparkles, Star, Gem, Award } from "lucide-react"
import { useAuthStore } from "@/store/auth"
import RelationshipModal from "@/components/mypage/relationship-modal"
import AllowanceSettingsModal from "@/components/mypage/allowance-settings-modal"
import HeroSection from "@/components/mypage/hero-section"
import AccountStatusCards from "@/components/mypage/account-status-cards"
import ProfileTab from "@/components/mypage/profile-tab"
import GiftCardsTab from "@/components/mypage/giftcards-tab"
import SettingsTab from "@/components/mypage/settings-tab"
import { getUserInfo, updateUser, checkNicknameDuplicate, getChildrenList, getAllRelationships } from "@/lib/api/user"
import { hanaMoneyApi } from "@/lib/api/hanamoney"
import { levels, getLevelProgress } from "@/lib/levels"
import { toast } from "sonner"

// 사용자 타입 정의
interface User {
  id: number
  name: string
  nickname: string | null
  email: string
  phone: string
  joinDate: string
  level: number
  currentExp: number
  nextLevelExp: number
  totalPoints: number
  hasWallet: boolean
  hasInvestmentAccount: boolean
  userType: "TEEN" | "PARENT"
  hasParentRelation?: boolean
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const sparkleAnimation = {
  animate: {
    scale: [1, 1.1, 1],
    rotate: [0, 180, 360],
    transition: {
      duration: 3,
      repeat: Number.POSITIVE_INFINITY,
    },
  },
}

export default function MyPage() {
  const { user: authUser, isLoggedIn, isInitialized } = useAuthStore()
  const [activeTab, setActiveTab] = useState("profile")
  const [isEditingNickname, setIsEditingNickname] = useState(false)
  const [nickname, setNickname] = useState("")
  const [nicknameStatus, setNicknameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")
  const [user, setUser] = useState<User | null>(null)
  const [hanaMoneyBalance, setHanaMoneyBalance] = useState<number>(0)
  const [showRelationshipModal, setShowRelationshipModal] = useState(false)
  const [showAllowanceModal, setShowAllowanceModal] = useState(false)
  const [childrenList, setChildrenList] = useState<any[]>([])
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [userInfo, setUserInfo] = useState<any>(null)

  // 활동일 계산 
  const activityDays = useMemo(() => {
    if (!user?.joinDate) return 0

    try {
      // 원본 ISO 날짜를 직접 사용
      const joinDate = new Date(userInfo.createdAt)

      if (!isNaN(joinDate.getTime())) {
        const today = new Date()
        const diffTime = Math.abs(today.getTime() - joinDate.getTime())
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      }
      return 0
    } catch (error) {
      console.error("활동일 계산 오류:", error)
      return 0
    }
  }, [user?.joinDate, userInfo?.createdAt])

  // 실제 사용자 정보 로드
  const loadUserInfo = async () => {
    try {
      // 로그인 상태 확인 (이미 상위에서 처리됨)
      if (!isLoggedIn || !authUser) {
        return
      }

      const userInfo = await getUserInfo(authUser.id)
      console.log("불러온 사용자 정보:", userInfo)
      setUserInfo(userInfo) // 추가
      
      // 하나머니 정보 로드
      const hanaMoneyResponse = await hanaMoneyApi.getHanaMoney()
      let balance = 0
      if (hanaMoneyResponse.data) {
        balance = Number(hanaMoneyResponse.data.balance)
        console.log("하나머니 잔액:", balance)
      } else {
        console.log("하나머니 조회 실패:", hanaMoneyResponse.error)
      }
      
      // 실제 사용자 정보와 기본값 결합
      const userWithDefaults: User = {
        id: userInfo.id,
        name: userInfo.name,
        nickname: userInfo.nickname,
        email: userInfo.email,
        phone: userInfo.phone,
        joinDate: new Date(userInfo.createdAt).toLocaleDateString('ko-KR'),
        level: (userInfo as any).level ?? 1,
        currentExp: (userInfo as any).totalExp ?? 0,
        nextLevelExp: 0,
        totalPoints: balance, // 실제 하나머니 잔액 사용
        hasWallet: userInfo.hasWallet || false, // API 응답 사용
        hasInvestmentAccount: userInfo.hasInvestmentAccount || false, // API 응답 사용
        userType: userInfo.userType, // API 응답 사용
        hasParentRelation: userInfo.hasParentRelation || false, // API 응답 사용
      }
      
      setUser(userWithDefaults)
      setHanaMoneyBalance(balance)
      setNickname(userInfo.nickname || "")

      // 부모 유저인 경우 자녀 목록 로드
      if (userInfo.userType === "PARENT") {
        try {
          // 모든 관계 정보를 가져와서 자녀 관계만 필터링
          const allRelationships = await getAllRelationships(authUser.id)
          console.log("전체 관계 정보:", allRelationships)
          
          const children = allRelationships
            .filter((relationship: any) => {
              console.log("관계 확인:", {
                type: relationship.type,
                status: relationship.status,
                requesterId: relationship.requesterId,
                receiverId: relationship.receiverId,
                authUserId: authUser.id
              })
              return relationship.type === "PARENT_CHILD" && relationship.status === "ACCEPTED"
            })
            .map((relationship: any) => {
              // 부모가 요청자인지 수신자인지 확인
              const isRequester = relationship.requesterId === authUser.id
              const childData = {
                id: isRequester ? relationship.receiverId : relationship.requesterId,
                name: isRequester ? relationship.receiverName : relationship.requesterName,
                nickname: isRequester ? relationship.receiverNickname : relationship.requesterNickname,
                email: isRequester ? (relationship.receiverEmail || "") : (relationship.requesterEmail || ""),
                phone: isRequester ? relationship.receiverPhone : relationship.requesterPhone,
                level: 1 // 기본값
              }
              console.log("자녀 데이터:", childData)
              return childData
            })
          
          setChildrenList(children)
          console.log("최종 자녀 목록:", children)
        } catch (error) {
          console.error("자녀 목록 로드 실패:", error)
          setChildrenList([])
        }
      }
    } catch (error: any) {
      console.error("사용자 정보 로드 실패:", error)
      // 에러 시 로그인 페이지로 리다이렉트
      if (error.response?.status === 401) {
        window.location.href = '/login'
      }
    } finally {
      setIsLoadingUser(false)
    }
  }

  useEffect(() => {
    // 인증이 초기화된 후에만 사용자 정보 로드
    if (isInitialized) {
      loadUserInfo()
    }
  }, [isInitialized, isLoggedIn, authUser])

  // 계좌 생성 후 사용자 정보 다시 로드
  const handleAccountCreated = async () => {
    console.log("계좌 생성 완료, 사용자 정보 다시 로드")
    await loadUserInfo()
  }

  const checkNicknameAvailability = async (newNickname: string) => {
    if (!user) return
    
    if (newNickname === user.nickname) {
      setNicknameStatus("idle")
      return
    }

    setNicknameStatus("checking")
    try {
      const isDuplicate = await checkNicknameDuplicate(newNickname)
      setNicknameStatus(isDuplicate ? "taken" : "available")
    } catch (error) {
      console.error("닉네임 중복 체크 실패:", error)
      setNicknameStatus("taken") // 에러 시 안전하게 taken으로 처리
    }
  }

  const handleNicknameChange = (value: string) => {
    setNickname(value)
    if (value.length >= 2) {
      checkNicknameAvailability(value)
    } else {
      setNicknameStatus("idle")
    }
  }

  const handleSaveNickname = async () => {
    if (!user || nicknameStatus !== "available") return
    
    try {
      const updatedUser = await updateUser(user.id, { nickname })
      setUser({ ...user, nickname: updatedUser.nickname })
      setIsEditingNickname(false)
      setNicknameStatus("idle")
    } catch (error: any) {
      toast.error(error.response?.data || "닉네임 저장에 실패했습니다.")
    }
  }

  // 인증이 초기화되었지만 로그인되지 않은 경우 로그인 페이지로 리다이렉트
  if (isInitialized && !isLoggedIn) {
    window.location.href = '/login'
    return null
  }

  // 인증이 초기화되지 않았거나 로딩 중이면 로딩 표시
  if (!isInitialized || isLoadingUser || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600">
            {!isInitialized ? "인증 상태를 확인하는 중..." : "사용자 정보를 불러오는 중..."}
          </p>
        </div>
      </div>
    )
  }

  const currentLevel = user ? levels[user.level] ?? levels[1] : levels[1]
  const nextLevel = user ? levels[user.level + 1] ?? null : null
  const { percent } = getLevelProgress(user?.currentExp ?? 0, user?.level ?? 1)
  const levelProgress = percent

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-100 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          variants={sparkleAnimation}
          animate="animate"
          className="absolute top-20 left-20 w-4 h-4 text-amber-400/60"
        >
          <Sparkles className="w-full h-full" />
        </motion.div>
        <motion.div
          variants={sparkleAnimation}
          animate="animate"
          style={{ animationDelay: "1s" }}
          className="absolute top-40 right-20 w-5 h-5 text-slate-400/60"
        >
          <Star className="w-full h-full" />
        </motion.div>
        <motion.div
          variants={sparkleAnimation}
          animate="animate"
          style={{ animationDelay: "1s" }}
          className="absolute top-1/2 left-20 w-5 h-5 text-teal-500/60"
        >
          <Clover className="w-full h-full" />
        </motion.div>
        <motion.div
          variants={sparkleAnimation}
          animate="animate"
          style={{ animationDelay: "2s" }}
          className="absolute bottom-32 left-20 w-4 h-4 text-stone-400/60"
        >
          <Gem className="w-full h-full" />
        </motion.div>
        <motion.div
          variants={sparkleAnimation}
          animate="animate"
          style={{ animationDelay: "0.5s" }}
          className="absolute bottom-20 right-20 w-5 h-5 text-amber-500/60"
        >
          <Award className="w-full h-full" />
        </motion.div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl relative z-10">
        <motion.div initial="initial" animate="animate" variants={staggerContainer}>
          {/* Hero Section */}
          <HeroSection
            user={user}
            nickname={nickname}
            setNickname={setNickname}
            isEditingNickname={isEditingNickname}
            setIsEditingNickname={setIsEditingNickname}
            nicknameStatus={nicknameStatus}
            handleNicknameChange={handleNicknameChange}
            handleSaveNickname={handleSaveNickname}
            currentLevel={currentLevel}
            nextLevel={nextLevel}
            levelProgress={levelProgress}
            activityDays={activityDays}
            hanaMoneyBalance={hanaMoneyBalance}
          />

          {/* Account Status Cards */}
          <AccountStatusCards
            user={user}
            onAccountCreated={handleAccountCreated}
          />

          {/* Main Content Tabs */}
          <motion.div variants={staggerContainer}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/90 backdrop-blur-md shadow-lg h-12 rounded-xl p-1 border border-slate-200/50">
                <TabsTrigger
                  value="profile"
                  className="flex items-center gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg font-medium text-sm transition-all duration-300 hover:bg-slate-100"
                >
                  <User className="w-4 h-4" />
                  내 정보
                </TabsTrigger>
                <TabsTrigger
                  value="giftcards"
                  className="flex items-center gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg font-medium text-sm transition-all duration-300 hover:bg-slate-100"
                >
                  <Gift className="w-4 h-4" />
                  보유 기프티콘
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="flex items-center gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg font-medium text-sm transition-all duration-300 hover:bg-slate-100"
                >
                  <Settings className="w-4 h-4" />
                  설정
                </TabsTrigger>
              </TabsList>

              {/* 내 정보 탭 */}
              <TabsContent value="profile" className="space-y-6">
                <ProfileTab user={user} />
              </TabsContent>

              {/* 보유 기프티콘 탭 */}
              <TabsContent value="giftcards" className="space-y-6">
                <GiftCardsTab />
              </TabsContent>

              {/* 설정 탭 */}
              <TabsContent value="settings" className="space-y-6">
                <SettingsTab 
                  onOpenRelationshipModal={() => setShowRelationshipModal(true)}
                  onOpenAllowanceModal={() => setShowAllowanceModal(true)}
                  userType={user.userType}
                />
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>

      {/* 관계 정보 관리 모달 */}
      <RelationshipModal
        isOpen={showRelationshipModal}
        onClose={() => setShowRelationshipModal(false)}
        userId={user?.id || 0}
      />

      {/* 용돈 설정 모달 */}
      <AllowanceSettingsModal
        isOpen={showAllowanceModal}
        onClose={() => setShowAllowanceModal(false)}
        parentId={user?.id || 0}
        children={childrenList}
      />
    </div>
  )
}

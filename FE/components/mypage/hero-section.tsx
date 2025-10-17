"use client"

import { motion, easeInOut } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Check, Clover, Compass, Crown, Edit3, Heart, Leaf, Loader2, Star, TreeDeciduousIcon, X } from "lucide-react"
import Image from "next/image"

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
}

interface HeroSectionProps {
  user: User
  nickname: string
  setNickname: (nickname: string) => void
  isEditingNickname: boolean
  setIsEditingNickname: (editing: boolean) => void
  nicknameStatus: "idle" | "checking" | "available" | "taken"
  handleNicknameChange: (value: string) => void
  handleSaveNickname: () => void
  currentLevel: any
  nextLevel: any
  levelProgress: number
  activityDays: number
  hanaMoneyBalance: number
}



const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] },
}

const floatingAnimation = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 4,
      repeat: Number.POSITIVE_INFINITY,
      ease: easeInOut,
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
      ease: easeInOut,
    },
  },
}

export default function HeroSection({
  user,
  nickname,
  setNickname,
  isEditingNickname,
  setIsEditingNickname,
  nicknameStatus,
  handleNicknameChange,
  handleSaveNickname,
  currentLevel,
  nextLevel,
  levelProgress,
  activityDays,
  hanaMoneyBalance,
}: HeroSectionProps) {
  const currentInLevelExp = Math.max(0, user.currentExp - (currentLevel?.minExp ?? 0))
  const requiredForNextLevel = nextLevel ? (nextLevel.minExp - (currentLevel?.minExp ?? 0)) : 0
  
  // 시간대별 인사말
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "좋은 아침이에요!"
    if (hour < 18) return "좋은 오후 보내세요!"
    return "편안한 저녁 되세요!"
  }

  // 부모 유저를 위한 심플한 히어로섹션
  if (user.userType === "PARENT") {
    return (
      <motion.div variants={fadeInUp} className="mb-10">
        <div className="relative overflow-hidden bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-600 rounded-3xl shadow-2xl">
          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Animated gradient orbs */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-cyan-400/40 to-teal-400/40 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 10,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 2,
              }}
              className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-emerald-400/30 to-teal-400/30 rounded-full blur-3xl"
            />
            
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width%3D%2260%22 height%3D%2260%22 viewBox%3D%220 0 60 60%22 xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg fill%3D%22none%22 fillRule%3D%22evenodd%22%3E%3Cg fill%3D%22%23ffffff%22 fillOpacity%3D%220.4%22%3E%3Cpath d%3D%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>
            </div>

            {/* Floating particles */}
            <motion.div
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
              }}
              transition={{
                duration: 6,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="absolute top-20 right-20 w-2 h-2 bg-white/40 rounded-full"
            />
            <motion.div
              animate={{
                y: [0, -15, 0],
                x: [0, -10, 0],
              }}
              transition={{
                duration: 7,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute bottom-32 right-32 w-3 h-3 bg-white/30 rounded-full"
            />
            <motion.div
              animate={{
                y: [0, -25, 0],
                x: [0, 15, 0],
              }}
              transition={{
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 2,
              }}
              className="absolute top-40 left-24 w-2 h-2 bg-white/35 rounded-full"
            />
          </div>

          <div className="relative py-14 px-8 lg:py-20 lg:px-12">
            {/* 배경 로고 + 뱃지 - 히어로섹션 세로 중앙 */}
            <div className="absolute inset-0 flex items-center pointer-events-none">
              <div className="ml-8 lg:ml-16 flex flex-col items-center gap-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, delay: 0.2 }}
                >
                  <Image
                    src="/hana-logo.png"
                    alt="Hana Logo"
                    width={240}
                    height={240}
                    className="opacity-[0.08] brightness-0 invert"
                    priority
                  />
                </motion.div>
                {/* 로고 아래 뱃지 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="pointer-events-auto"
                >
                  <div className="px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
                    <span className="text-xs lg:text-sm text-white/80 font-semibold tracking-wide">부모님용</span>
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="max-w-2xl mx-auto relative z-10">

              {/* 상단 장식 라인 */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="w-20 h-1 bg-white/40 rounded-full mx-auto mb-10 shadow-lg"
              />
              
              <div className="text-center space-y-4">
                {/* 메인 인사말 */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-3xl lg:text-4xl font-bold text-white tracking-tight drop-shadow-lg"
                >
                  {user.name} 님, {getGreeting()}
                </motion.h1>
                
                {/* 서브 텍스트 */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                  className="text-base lg:text-lg text-white/90 font-medium drop-shadow-md"
                >
                  자녀의 성장을 함께 응원합니다
                </motion.p>
              </div>

              {/* 하단 장식 라인 */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="w-20 h-1 bg-white/40 rounded-full mx-auto mt-10 shadow-lg"
              />
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // 청소년 유저를 위한 기존 히어로섹션
  return (
    <motion.div variants={fadeInUp} className="mb-10">
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl shadow-2xl border border-teal-600/20">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width%3D%2260%22 height%3D%2260%22 viewBox%3D%220 0 60 60%22 xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg fill%3D%22none%22 fillRule%3D%22evenodd%22%3E%3Cg fill%3D%22%23ffffff%22 fillOpacity%3D%220.1%22%3E%3Ccircle cx%3D%2230%22 cy%3D%2230%22 r%3D%222%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>
        </div>

        <div className="relative p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* 3D Characters Section */}
            <motion.div variants={floatingAnimation} animate="animate" className="flex-shrink-0">
              <div className="relative">
                <Image
                  src="/mypage-hero.png"
                  alt="마이페이지 캐릭터"
                  width={280}
                  height={280}
                  className="drop-shadow-2xl"
                  priority
                />
                {/* Floating Elements */}
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-xl"
                >
                  <Crown className="w-5 h-5 text-amber-900" />
                </motion.div>
                <motion.div
                  animate={{
                    y: [0, -6, 0],
                    rotate: [0, 8, -8, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                  className="absolute -bottom-2 -left-3 w-8 h-8 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center shadow-xl"
                >
                  <Heart className="w-4 h-4 text-rose-900" />
                </motion.div>
              </div>
            </motion.div>

            {/* Profile Section */}
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-center lg:justify-start gap-4">
                    <h1 className="text-4xl lg:text-5xl font-black text-white drop-shadow-lg">{user.name}님</h1>
                                    <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                  className="transform-gpu will-change-transform"
                >
                  <Badge className="whitespace-nowrap bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 font-bold px-4 py-2 text-base shadow-lg bg-clip-padding border border-emerald-500/60">
                    <Leaf className="w-4 h-4 mr-2 text-white" />
                    {currentLevel?.nameEn || "PREMIUM"}
                  </Badge>
                </motion.div>
                  </div>

                  <div className="flex items-center justify-center lg:justify-start gap-3">
                    {isEditingNickname ? (
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Input
                            value={nickname}
                            onChange={(e) => handleNicknameChange(e.target.value)}
                            className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/15 text-lg font-medium backdrop-blur-sm"
                            placeholder="닉네임을 입력하세요"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {nicknameStatus === "checking" && (
                              <Loader2 className="w-4 h-4 text-white animate-spin" />
                            )}
                            {nicknameStatus === "available" && <Check className="w-4 h-4 text-emerald-300" />}
                            {nicknameStatus === "taken" && <X className="w-4 h-4 text-red-300" />}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={handleSaveNickname}
                          disabled={nicknameStatus !== "available"}
                          className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-medium backdrop-blur-sm"
                        >
                          저장
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setIsEditingNickname(false)
                            setNickname(user.nickname || "")
                          }}
                          className="text-white hover:bg-white/10 font-medium"
                        >
                          취소
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="text-xl text-white/90 font-medium">@{user.nickname || "닉네임을 설정해주세요"}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-8 h-8 text-white hover:bg-white/10 rounded-lg"
                          onClick={() => setIsEditingNickname(true)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>

                  {nicknameStatus === "taken" && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-300 text-sm font-medium"
                    >
                      이미 사용중인 닉네임입니다
                    </motion.p>
                  )}

                  <p className="text-white/70 text-base font-medium">
                    가입일: {user.joinDate} • 활동일: {activityDays}일
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Level & Stats Section */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Level Card */}
                <motion.div
                  whileHover={{ scale: 1.02, rotateY: 2 }}
                  className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="text-2xl"
                    >
                      {currentLevel.icons}
                    </motion.div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Level {user.level}</h3>
                      <p className="text-white/80 text-sm font-medium">{currentLevel.nameKo} {currentLevel.nameEn}</p>
                    </div>
                  </div>
                    <div className="space-y-3">
                    <div className="flex justify-between text-sm text-white/80 font-medium">
                      <span>경험치</span>
                        <span>
                          {nextLevel
                            ? `${currentInLevelExp.toLocaleString()} / ${requiredForNextLevel.toLocaleString()}`
                            : "MAX"}
                        </span>
                    </div>
                    <div className="relative">
                      <Progress
                        value={levelProgress}
                        className="h-3 rounded-full overflow-hidden bg-white/15 ring-1 ring-white/20 shadow-inner [&>*]:rounded-full [&>*]:bg-gradient-to-r [&>*]:from-white [&>*]:via-slate-100 [&>*]:to-slate-200 [&>*]:opacity-80 [&>*]:transition-[transform] [&>*]:duration-700 [&>*]:ease-out"
                      />
                    </div>
                      {nextLevel && (
                        <p className="text-xs text-white/70 font-medium text-center">
                          다음 레벨까지 {(nextLevel.minExp - user.currentExp).toLocaleString()} EXP
                        </p>
                      )}
                  </div>
                </motion.div>

                {/* Points Card */}
                <motion.div
                  whileHover={{ scale: 1.02, rotateY: -2 }}
                  className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 180, 360],
                      }}
                      transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                      className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg"
                    >
                                              <Star className="w-6 h-6 text-emerald-900" />
                    </motion.div>
                    <div>
                      <h3 className="text-white font-bold text-lg">하나머니</h3>
                      <p className="text-white/80 text-sm font-medium">보유 포인트</p>
                    </div>
                  </div>
                  <motion.p
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                    className="text-3xl font-black text-emerald-300 drop-shadow-lg"
                  >
                    {hanaMoneyBalance.toLocaleString()} P
                  </motion.p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 
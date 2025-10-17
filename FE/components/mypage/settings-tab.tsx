"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Bell,
  Eye,
  EyeOff,
  Lock,
  Settings,
  Shield,
  User,
  X,
  Wallet,
} from "lucide-react"

interface SettingsTabProps {
  onOpenRelationshipModal: () => void
  onOpenAllowanceModal?: () => void
  userType?: "TEEN" | "PARENT"
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
}

export default function SettingsTab({ onOpenRelationshipModal, onOpenAllowanceModal, userType }: SettingsTabProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <>
      {/* 보안 설정 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-50 rounded-t-2xl border-b-0">
            <CardTitle className="flex items-center gap-3 text-xl">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-600 rounded-xl flex items-center justify-center shadow-md"
              >
                <Shield className="w-5 h-5 text-white" />
              </motion.div>
              보안 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <motion.div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-2">
                  <Lock className="w-4 h-4 text-teal-600" />
                  현재 비밀번호
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="현재 비밀번호를 입력하세요"
                    className="pr-12 h-11 text-sm rounded-lg border border-slate-200 focus:border-teal-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>
              <motion.div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-2">
                  <Lock className="w-4 h-4 text-teal-600" />새 비밀번호
                </Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="새 비밀번호를 입력하세요"
                    className="pr-12 h-11 text-sm rounded-lg border border-slate-200 focus:border-teal-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>
              <motion.div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-2">
                  <Lock className="w-4 h-4 text-teal-600" />새 비밀번호 확인
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="새 비밀번호를 다시 입력하세요"
                    className="pr-12 h-11 text-sm rounded-lg border border-slate-200 focus:border-teal-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>
            </div>
            <Separator className="my-6" />
            <div className="flex justify-end">
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button className="bg-gradient-to-r from-teal-600 to-teal-600 hover:from-teal-700 hover:to-teal-700 px-8 py-2.5 rounded-lg font-medium text-sm shadow-md">
                  <Shield className="w-4 h-4 mr-2" />
                  비밀번호 변경
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 계정 관리 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="bg-slate-100/50 rounded-t-2xl border-b-0">
            <CardTitle className="flex items-center gap-3 text-xl">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-10 h-10 bg-slate-600 rounded-xl flex items-center justify-center shadow-md"
              >
                <User className="w-5 h-5 text-white" />
              </motion.div>
              계정 관리
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <motion.div>
              <div className="flex items-center justify-between p-5 bg-cyan-50/50 rounded-xl border-0 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center shadow-md">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">알림 설정</h4>
                    <p className="text-slate-600 text-sm">기프티콘 만료, 투자 알림 등</p>
                  </div>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button className="bg-cyan-600/90 hover:bg-cyan-700/90 rounded-lg font-medium px-5 py-2 shadow-md text-sm">
                    <Settings className="w-4 h-4 mr-1" />
                    설정
                  </Button>
                </motion.div>
              </div>
            </motion.div>
            <motion.div>
              <div className="flex items-center justify-between p-5 bg-sky-50/50 rounded-xl border-0 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">관계 정보 관리</h4>
                    <p className="text-slate-600 text-sm">가족, 친구와의 관계 관리</p>
                  </div>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                      <Button 
                      onClick={onOpenRelationshipModal}
                      className="bg-sky-600/90 hover:bg-sky-700/90 rounded-lg font-medium px-5 py-2 shadow-md text-sm"
                    >
                                          <User className="w-4 h-4 mr-1" />
                      관리
                  </Button>
                </motion.div>
              </div>
            </motion.div>
            
            {/* 용돈 설정 섹션 - 부모 유저만 표시 */}
            {userType === "PARENT" && (
              <motion.div>
                                <div className="flex items-center justify-between p-5 bg-sky-50/50 rounded-xl border-0 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center shadow-md">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">용돈 설정</h4>
                      <p className="text-slate-600 text-sm">자녀에게 정기 용돈 지급 설정</p>
                    </div>
                  </div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      onClick={onOpenAllowanceModal}
                      className="bg-sky-600/90 hover:bg-sky-700/90 rounded-lg font-medium px-5 py-2 shadow-md text-sm"
                    >
                      <Wallet className="w-4 h-4 mr-1" />
                      관리
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}
            <motion.div>
              <div className="flex items-center justify-between p-5 bg-sky-50/50 rounded-xl border-0 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-sky-700 rounded-lg flex items-center justify-center shadow-md">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">개인정보 처리방침</h4>
                    <p className="text-slate-600 text-sm">개인정보 처리방침 확인</p>
                  </div>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    className="bg-sky-700/90 hover:bg-sky-800/90 rounded-lg font-medium px-5 py-2 shadow-md text-sm"
                  >
                                          <Eye className="w-4 h-4 mr-1" />
                      보기
                  </Button>
                </motion.div>
              </div>
            </motion.div>
            <motion.div>
                            <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-xl border-0 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center shadow-md">
                    <X className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-700">회원 탈퇴</h4>
                    <p className="text-slate-600 text-sm">계정을 영구적으로 삭제합니다</p>
                  </div>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    className="bg-slate-600/90 hover:bg-slate-700/90 rounded-lg font-medium px-5 py-2 shadow-md text-sm"
                  >
                    <X className="w-4 h-4 mr-1" />
                    탈퇴하기
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
} 
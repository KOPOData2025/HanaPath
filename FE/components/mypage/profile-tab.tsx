"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Check, Calendar, Mail, Phone, User, UserCheck } from "lucide-react"

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
}

interface ProfileTabProps {
  user: User
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
}

export default function ProfileTab({ user }: ProfileTabProps) {
  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (phone: string) => {
    const phoneNumber = phone.replace(/[^\d]/g, "")
    
    if (phoneNumber.length === 11) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`
    }
    return phone // 형식이 올바르지 않으면 원본 반환
  }

  return (
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
              <User className="w-5 h-5 text-white" />
            </motion.div>
            기본 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <motion.div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-slate-600" />
                  이름
                </Label>
                <Input
                  value={user.name}
                  readOnly
                  className="bg-slate-50 h-11 text-sm font-medium rounded-lg border border-slate-200"
                />
              </motion.div>
              <motion.div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-600" />
                  이메일
                </Label>
                <Input
                  value={user.email}
                  readOnly
                  className="bg-slate-50 h-11 text-sm font-medium rounded-lg border border-slate-200"
                />
              </motion.div>
            </div>
            <div className="space-y-4">
              <motion.div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-600" />
                  휴대폰 번호
                </Label>
                <Input
                  defaultValue={formatPhoneNumber(user.phone)}
                  className="h-11 text-sm rounded-lg border border-slate-200 focus:border-slate-400"
                />
              </motion.div>
              <motion.div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  가입일
                </Label>
                <Input
                  value={user.joinDate}
                  readOnly
                  className="bg-slate-50 h-11 text-sm font-medium rounded-lg border border-slate-200"
                />
              </motion.div>
            </div>
          </div>
          <Separator className="my-6" />
          <div className="flex justify-end">
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button className="bg-gradient-to-r from-teal-600 to-teal-600 hover:from-teal-700 hover:to-teal-700 px-8 py-2.5 rounded-lg font-medium text-sm shadow-md">
                <Check className="w-4 h-4 mr-2" />
                정보 저장
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 
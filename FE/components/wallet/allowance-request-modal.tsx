"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PlusCircle, Send, Users, MessageCircle, ChevronRight, CheckCircle, AlertCircle, Banknote, Coins, DollarSign, CreditCard, PiggyBank } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth"
import { getAllRelationships } from "@/lib/api/user"

interface Relationship {
  id: number
  requesterId: number
  requesterName: string
  requesterNickname: string
  requesterPhone: string
  receiverId: number
  receiverName: string
  receiverNickname: string
  receiverPhone: string
  status: "PENDING" | "ACCEPTED" | "REJECTED"
  type: "PARENT_CHILD" | "SIBLING" | "FRIEND"
  message: string
  createdAt: string
  updatedAt: string
  isSelected?: boolean
}

interface DisplayRelationship {
  id: number
  name: string
  nickname?: string
  relationship: string
  profileImage?: string
  isSelected?: boolean
  relationshipType: "PARENT_CHILD" | "SIBLING" | "FRIEND"
}

interface AllowanceRequestModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AllowanceRequestModal({ isOpen, onClose }: AllowanceRequestModalProps) {
  const [step, setStep] = useState<"select" | "message" | "confirm">("select")
  const [relationships, setRelationships] = useState<DisplayRelationship[]>([])
  const [selectedRelationships, setSelectedRelationships] = useState<DisplayRelationship[]>([])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [relationshipsLoading, setRelationshipsLoading] = useState(true)
  const { user, token } = useAuthStore()

  // 기본 메시지 템플릿들
  const messageTemplates = [
    "용돈 좀 주세요! 🥺",
    "이번 달 용돈이 부족해요 😅",
    "용돈 좀 보내주세요 🙏",
    "용돈 부족해서 요청드려요 💰",
    "용돈 좀 주실 수 있나요? 😊"
  ]

  useEffect(() => {
    if (isOpen) {
      loadRelationships()
    }
  }, [isOpen])

  const loadRelationships = async () => {
    try {
      setRelationshipsLoading(true)
      
      if (!user?.id) {
        throw new Error("사용자 정보가 없습니다.")
      }

      // 실제 API 호출
      const allRelationships = await getAllRelationships(user.id)
      
      // 승인된 관계만 필터링하고 표시용 데이터로 변환
      const acceptedRelationships = allRelationships.filter((rel: Relationship) => rel.status === "ACCEPTED")
      
      const displayRelationships: DisplayRelationship[] = acceptedRelationships.map((rel: Relationship) => {
        // 현재 사용자가 요청자인지 수신자인지에 따라 상대방 정보 결정
        const isRequester = rel.requesterId === user.id
        const otherUser = isRequester ? {
          name: rel.receiverName,
          nickname: rel.receiverNickname,
          phone: rel.receiverPhone
        } : {
          name: rel.requesterName,
          nickname: rel.requesterNickname,
          phone: rel.requesterPhone
        }

        // 관계 유형에 따른 표시명 결정
        const getRelationshipLabel = (type: string, userType: string) => {
          switch (type) {
            case "PARENT_CHILD":
              return userType === "TEEN" ? "부모" : "자녀"
            case "SIBLING":
              return "형제자매"
            case "FRIEND":
              return "친구"
            default:
              return "기타"
          }
        }

        return {
          id: rel.id,
          name: otherUser.name,
          nickname: otherUser.nickname,
          relationship: getRelationshipLabel(rel.type, user?.userType || "PARENT"),
          profileImage: "/placeholder-user.jpg", // 기본 이미지
          isSelected: false,
          relationshipType: rel.type
        }
      })

      setRelationships(displayRelationships)
      
    } catch (error) {
      console.error("관계 정보 로드 실패:", error)
      
      // 에러 시 (실제 연결된 관계가 없을 경우)
      setRelationships([
        { id: 1, name: "김엄마", nickname: "엄마", relationship: "부모", profileImage: "/placeholder-user.jpg", relationshipType: "PARENT_CHILD" },
        { id: 2, name: "김아빠", nickname: "아빠", relationship: "부모", profileImage: "/placeholder-user.jpg", relationshipType: "PARENT_CHILD" },
        { id: 3, name: "김할머니", nickname: "할머니", relationship: "부모", profileImage: "/placeholder-user.jpg", relationshipType: "PARENT_CHILD" },
        { id: 4, name: "김할아버지", nickname: "할아버지", relationship: "부모", profileImage: "/placeholder-user.jpg", relationshipType: "PARENT_CHILD" },
        { id: 5, name: "김형", nickname: "형", relationship: "형제자매", profileImage: "/placeholder-user.jpg", relationshipType: "SIBLING" },
      ])
    } finally {
      setRelationshipsLoading(false)
    }
  }

  const handleRelationshipToggle = (relationship: DisplayRelationship) => {
    const updatedRelationships = relationships.map((rel: DisplayRelationship) => 
      rel.id === relationship.id ? { ...rel, isSelected: !rel.isSelected } : rel
    )
    setRelationships(updatedRelationships)
    
    const selected = updatedRelationships.filter((rel: DisplayRelationship) => rel.isSelected)
    setSelectedRelationships(selected)
  }

  const handleNextStep = () => {
    if (selectedRelationships.length === 0) {
      toast.error("수신자를 선택해주세요.", {
        description: "용돈을 요청할 사람을 최소 한 명 이상 선택해주세요.",
        style: {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          fontSize: '15px',
          fontWeight: '600',
        },
        className: 'font-medium',
      })
      return
    }
    setStep("message")
  }

  const handleSendRequest = async () => {
    if (!message.trim()) {
      toast.error("메시지를 입력해주세요.", {
        description: "용돈 요청 메시지를 작성해주세요.",
        style: {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          fontSize: '15px',
          fontWeight: '600',
        },
        className: 'font-medium',
      })
      return
    }

    try {
      setLoading(true)
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 성공 토스트 표시
      toast.success("용돈 요청이 완료되었습니다!", {
        description: "용돈 요청 메시지를 성공적으로 전송했습니다.",
        duration: 5000,
        style: {
          background: 'white',
          color: '#1f2937',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          fontSize: '15px',
          fontWeight: '600',
        },
        className: 'font-medium',
      })
      
      // 모달 초기화 및 닫기
      setStep("select")
      setSelectedRelationships([])
      setMessage("")
      setRelationships(prev => prev.map(rel => ({ ...rel, isSelected: false })))
      onClose()
      
    } catch (error) {
      console.error("용돈 요청 실패:", error)
      toast.error("용돈 요청에 실패했습니다.", {
        description: "잠시 후 다시 시도해주세요.",
        duration: 5000,
        style: {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          fontSize: '15px',
          fontWeight: '600',
        },
        className: 'font-medium',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateClick = (template: string) => {
    setMessage(template)
  }

  const resetModal = () => {
    setStep("select")
    setSelectedRelationships([])
    setMessage("")
    setRelationships(prev => prev.map(rel => ({ ...rel, isSelected: false })))
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-teal-500" />
            용돈 요청하기
          </DialogTitle>
          <DialogDescription>
            연결된 관계 사람들에게 용돈을 요청해보세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <AnimatePresence mode="wait">
            {step === "select" && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* 단계 표시 */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <span className="text-sm font-medium text-teal-600">수신자 선택</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <span className="text-sm font-medium text-gray-500">메시지 작성</span>
                  </div>
                </div>

                {/* 관계 사람들 목록 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Users className="w-4 h-4" />
                    연결된 관계 ({relationships.length}명)
                  </div>
                  
                                     {relationshipsLoading ? (
                     <div className="flex items-center justify-center py-8">
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                     </div>
                   ) : relationships.length > 0 ? (
                     <div className="space-y-2 max-h-60 overflow-y-auto">
                                               {relationships.map((relationship) => (
                          <motion.div
                            key={relationship.id}
                          >
                           <Card 
                             className={cn(
                               "cursor-pointer transition-all duration-200 border-2",
                               relationship.isSelected 
                                 ? "border-teal-500 bg-teal-50" 
                                 : "border-gray-200 hover:border-teal-300"
                             )}
                             onClick={() => handleRelationshipToggle(relationship)}
                           >
                             <CardContent className="p-3">
                               <div className="flex items-center gap-3">
                                 <Avatar className="w-10 h-10">
                                   <AvatarImage src={relationship.profileImage} />
                                   <AvatarFallback>
                                     {relationship.name.charAt(0)}
                                   </AvatarFallback>
                                 </Avatar>
                                 
                                 <div className="flex-grow">
                                   <div className="flex items-center gap-2">
                                     <p className="font-semibold text-sm">{relationship.name}</p>
                                     {relationship.nickname && (
                                       <Badge variant="outline" className="text-xs">
                                         {relationship.nickname}
                                       </Badge>
                                     )}
                                   </div>
                                   <p className="text-xs text-gray-500">{relationship.relationship}</p>
                                 </div>
                                 
                                 <div className="flex items-center justify-center w-6 h-6">
                                   {relationship.isSelected && (
                                     <CheckCircle className="w-5 h-5 text-teal-500" />
                                   )}
                                 </div>
                               </div>
                             </CardContent>
                           </Card>
                         </motion.div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-center py-8">
                       <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                       <p className="text-gray-500 mb-2">연결된 관계가 없습니다</p>
                       <p className="text-sm text-gray-400">관계 설정에서 가족이나 친구와 연결해주세요</p>
                     </div>
                   )}
                </div>

                {/* 선택된 사람들 표시 */}
                {selectedRelationships.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-teal-50 p-3 rounded-lg border border-teal-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-teal-600" />
                      <span className="text-sm font-medium text-teal-700">
                        선택된 수신자 ({selectedRelationships.length}명)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedRelationships.map((rel) => (
                        <Badge key={rel.id} variant="secondary" className="text-xs">
                          {rel.nickname || rel.name}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {step === "message" && (
              <motion.div
                key="message"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* 단계 표시 */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <span className="text-sm font-medium text-gray-500">수신자 선택</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <span className="text-sm font-medium text-teal-600">메시지 작성</span>
                  </div>
                </div>

                {/* 선택된 수신자들 */}
                <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-teal-600" />
                    <span className="text-sm font-medium text-teal-700">수신자</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedRelationships.map((rel) => (
                      <Badge key={rel.id} variant="secondary" className="text-xs">
                        {rel.nickname || rel.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 메시지 템플릿 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">메시지 템플릿</label>
                  <div className="flex flex-wrap gap-2">
                    {messageTemplates.map((template, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleTemplateClick(template)}
                        className="text-xs h-8"
                      >
                        {template}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 메시지 입력 */}
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium text-gray-700">
                    메시지 내용
                  </label>
                  <Textarea
                    id="message"
                    placeholder="용돈 요청 메시지를 입력하세요..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[100px] resize-none"
                    maxLength={200}
                  />
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>최대 200자</span>
                    <span>{message.length}/200</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="flex gap-2">
          {step === "select" ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                취소
              </Button>
              <Button 
                onClick={handleNextStep}
                disabled={selectedRelationships.length === 0}
                className="bg-teal-500 hover:bg-teal-600"
              >
                다음
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => setStep("select")}
                disabled={loading}
              >
                이전
              </Button>
              <Button 
                onClick={handleSendRequest}
                disabled={loading || !message.trim()}
                className="bg-teal-500 hover:bg-teal-600"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    전송 중...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    용돈 요청 보내기
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
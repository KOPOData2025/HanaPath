"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  UserPlus,
  Users,
  UserCheck,
  UserX,
  Phone,
  MessageSquare,
  Trash2,
  Check,
  X,
  Loader2,
  Heart,
  Users2,
  Baby,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Crown,
  Shield,
  Star,
  Home,
  UserCheck2,
  Clock,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth"
import { 
  createRelationship, 
  getReceivedRequests, 
  getSentRequests, 
  getAllRelationships,
  updateRelationshipStatus,
  deleteRelationship,
  checkNicknameDuplicate
} from "@/lib/api/user"

interface RelationshipModalProps {
  isOpen: boolean
  onClose: () => void
  userId: number
  onRelationshipUpdate?: () => void
}

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
}

const relationshipTypeLabels = {
  PARENT_CHILD: "부모-자식",
  SIBLING: "형제자매",
  FRIEND: "친구"
}

// 사용자 타입에 따른 아이콘 매핑
const getRelationshipTypeIcons = (userType: string) => {
  if (userType === "TEEN") {
    return {
      PARENT_CHILD: UserCheck2, // 청소년이 보는 부모님 아이콘 (성인 사용자)
      SIBLING: Users2,
      FRIEND: Heart
    }
  } else {
    return {
      PARENT_CHILD: Baby, // 부모가 보는 자녀 아이콘
      SIBLING: Users2,
      FRIEND: Heart
    }
  }
}

export default function RelationshipModal({ isOpen, onClose, userId, onRelationshipUpdate }: RelationshipModalProps) {
  const { user: authUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState("all")
  const [receivedRequests, setReceivedRequests] = useState<Relationship[]>([])
  const [sentRequests, setSentRequests] = useState<Relationship[]>([])
  const [allRelationships, setAllRelationships] = useState<Relationship[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  
  // 새 관계 요청 폼 상태
  const [newRequest, setNewRequest] = useState({
    receiverPhone: "",
    type: "PARENT_CHILD" as "PARENT_CHILD" | "SIBLING" | "FRIEND",
    message: ""
  })

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const phoneNumber = value.replace(/[^\d]/g, "")
    
    // 길이에 따라 포맷팅
    if (phoneNumber.length <= 3) {
      return phoneNumber
    } else if (phoneNumber.length <= 7) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`
    } else {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`
    }
  }

  useEffect(() => {
    if (isOpen) {
      console.log("관계 모달 열림 - 사용자 ID:", userId)
      console.log("localStorage 토큰:", localStorage.getItem("access_token") ? "있음" : "없음")
      loadRelationships()
    }
  }, [isOpen, userId])

  // 관계 업데이트 이벤트 리스너
  useEffect(() => {
    const handleRelationshipUpdate = (event: CustomEvent) => {
      if (isOpen) {
        loadRelationships()
        
        // 토스트 메시지로 사용자에게 알림
        if (event.detail?.action) {
          const actionText = event.detail.action === 'ACCEPTED' ? '승인' : '거절'
          toast.success(`알림에서 관계 요청을 ${actionText}했습니다.`)
        }
      }
    }

    window.addEventListener('relationshipUpdated', handleRelationshipUpdate as EventListener)
    
    return () => {
      window.removeEventListener('relationshipUpdated', handleRelationshipUpdate as EventListener)
    }
  }, [isOpen])

  const loadRelationships = async () => {
    setIsLoading(true)
    try {
      const [received, sent, all] = await Promise.all([
        getReceivedRequests(userId),
        getSentRequests(userId),
        getAllRelationships(userId)
      ])
      setReceivedRequests(received)
      setSentRequests(sent)
      setAllRelationships(all)
    } catch (error) {
      console.error("관계 정보 로드 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRequest = async () => {
    if (!newRequest.receiverPhone.trim()) {
      toast.dismiss()
      toast.error("전화번호를 입력해주세요", {
        icon: <Phone className="w-5 h-5 text-amber-500" />,
        description: "상대방의 전화번호가 필요합니다",
        className: "group border-amber-100 bg-amber-50/90 text-amber-900"
      })
      return
    }

    setIsCreating(true)
    try {
      // 전화번호에서 하이픈과 모든 특수문자 제거하여 숫자만 추출
      const cleanPhone = newRequest.receiverPhone.replace(/[^\d]/g, "")
      console.log("원본 전화번호:", newRequest.receiverPhone)
      console.log("정리된 전화번호:", cleanPhone)
      console.log("관계 요청 데이터:", { userId, requestData: { ...newRequest, receiverPhone: cleanPhone } })
      
      if (cleanPhone.length !== 11) {
        toast.dismiss()
        toast.error("올바른 전화번호 형식이 아닙니다", {
          icon: <Phone className="w-5 h-5 text-orange-500" />,
          description: "010-0000-0000 형식으로 입력해주세요",
          className: "group border-orange-100 bg-orange-50/90 text-orange-900"
        })
        return
      }
      
      await createRelationship(userId, { ...newRequest, receiverPhone: cleanPhone })
      setNewRequest({ receiverPhone: "", type: "PARENT_CHILD", message: "" })
      await loadRelationships()
      
      toast.dismiss()
      toast.success("관계 요청을 전송했습니다", {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        description: "상대방이 확인하면 알림을 받게 됩니다",
        className: "group border-emerald-100 bg-emerald-50/90 text-emerald-900"
      })
    } catch (error: any) {
      console.error("관계 요청 오류:", error)
      console.error("오류 응답:", error.response)
      
      // 백엔드에서 오는 구체적인 오류 메시지 처리
      let errorMessage = "관계 요청 전송에 실패했습니다."
      
      if (error.response?.data) {
        // 백엔드에서 문자열로 오는 경우
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        }
        // 백엔드에서 객체로 오는 경우 (message 필드)
        else if (error.response.data.message) {
          errorMessage = error.response.data.message
        }
        // 기타 형태
        else {
          errorMessage = JSON.stringify(error.response.data)
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      // 토스트 중복 방지를 위해 기존 토스트 dismiss
      toast.dismiss()
      
      // 특정 메시지에 따라 다른 아이콘과 스타일 적용
      if (errorMessage.includes("존재하지 않는 사용자")) {
        toast.error("사용자를 찾을 수 없습니다", {
          icon: <UserX className="w-5 h-5 text-red-500" />,
          description: "입력한 전화번호를 다시 확인해주세요",
          className: "group border-red-100 bg-red-50/90 text-red-900"
        })
      } else if (errorMessage.includes("이미 승인된 관계")) {
        toast.error("이미 연결된 관계입니다", {
          icon: <UserCheck className="w-5 h-5 text-blue-500" />,
          description: "현재 승인된 관계가 존재합니다",
          className: "group border-blue-100 bg-blue-50/90 text-blue-900"
        })
      } else if (errorMessage.includes("이미 관계 요청을 보냈습니다")) {
        toast.error("대기 중인 요청이 있습니다", {
          icon: <Users className="w-5 h-5 text-amber-500" />,
          description: "상대방의 응답을 기다려주세요",
          className: "group border-amber-100 bg-amber-50/90 text-amber-900"
        })
      } else if (errorMessage.includes("자기 자신")) {
        toast.error("잘못된 요청입니다", {
          icon: <AlertCircle className="w-5 h-5 text-orange-500" />,
          description: "본인이 아닌 다른 사용자를 선택해주세요",
          className: "group border-orange-100 bg-orange-50/90 text-orange-900"
        })
      } else {
        toast.error("요청을 처리할 수 없습니다", {
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
          description: errorMessage,
          className: "group border-red-100 bg-red-50/90 text-red-900"
        })
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateStatus = async (relationshipId: number, status: "ACCEPTED" | "REJECTED") => {
    try {
      await updateRelationshipStatus(userId, relationshipId, status)
      await loadRelationships()
      
      // 부모 컴포넌트에 관계 업데이트 알림
      onRelationshipUpdate?.()
      
      toast.dismiss()
      if (status === "ACCEPTED") {
        toast.success("관계 요청을 승인했습니다", {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          description: "새로운 관계가 연결되었습니다",
          className: "group border-emerald-100 bg-emerald-50/90 text-emerald-900"
        })
      } else {
        toast.success("관계 요청을 거절했습니다", {
          icon: <X className="w-5 h-5 text-gray-500" />,
          description: "요청이 정상적으로 처리되었습니다",
          className: "group border-gray-100 bg-gray-50/90 text-gray-900"
        })
      }
    } catch (error: any) {
      toast.dismiss()
      toast.error("요청 처리에 실패했습니다", {
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
        description: error.response?.data || "다시 시도해주세요",
        className: "group border-red-100 bg-red-50/90 text-red-900"
      })
    }
  }

  const handleDeleteRelationship = async (relationshipId: number) => {
    try {
      await deleteRelationship(userId, relationshipId)
      await loadRelationships()
      
      toast.dismiss()
      toast.success("관계가 삭제되었습니다", {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        description: "관계 정보가 완전히 제거되었습니다",
        className: "group border-emerald-100 bg-emerald-50/90 text-emerald-900"
      })
    } catch (error: any) {
      toast.dismiss()
      toast.error("관계 삭제에 실패했습니다", {
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
        description: error.response?.data || "다시 시도해주세요",
        className: "group border-red-100 bg-red-50/90 text-red-900"
      })
    }
    setDeleteConfirmId(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>대기중</span>
          </div>
        )
      case "ACCEPTED":
        return (
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>승인됨</span>
          </div>
        )
      case "REJECTED":
        return (
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-2.5 py-1 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>거절됨</span>
          </div>
        )
      default:
        return null
    }
  }

  const getRelationshipCard = (relationship: Relationship, isRequester: boolean) => {
    const otherUser = isRequester ? relationship.receiverName : relationship.requesterName
    const otherPhone = isRequester ? relationship.receiverPhone : relationship.requesterPhone
    const relationshipTypeIcons = getRelationshipTypeIcons(authUser?.userType || "PARENT")
    const TypeIcon = relationshipTypeIcons[relationship.type]

    // 전화번호 포맷팅
    const formatDisplayPhone = (phone: string) => {
      if (!phone) return "전화번호 없음"
      const cleanPhone = phone.replace(/[^\d]/g, "")
      if (cleanPhone.length === 11) {
        return `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 7)}-${cleanPhone.slice(7)}`
      }
      return phone
    }

    return (
      <motion.div
        key={relationship.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-4 border border-slate-100"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center">
              <TypeIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-slate-800">{otherUser}</h4>
                <div className="inline-flex items-center rounded-full border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-slate-100 text-slate-700 px-2.5 py-1 text-xs">
                  <Users className="w-3 h-3 mr-1.5" />
                  {relationshipTypeLabels[relationship.type]}
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <Phone className="w-3 h-3" />
                {formatDisplayPhone(otherPhone)}
              </div>
              {relationship.message && (
                <div className="relative mt-4">
                  <div className={`relative bg-blue-100/80 rounded-2xl px-4 py-5 max-w-xs ${!isRequester ? 'ml-0' : 'ml-auto mr-0'}`}>
                    {/* 요청을 받은 사람의 말풍선 꼬리 (왼쪽) */}
                    {!isRequester && (
                      <>
                        <div className="absolute -top-2 left-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-blue-100/80"></div>
                        <div className="absolute -top-1 left-4 w-0 h-0 border-l-6 border-r-6 border-b-6 border-l-transparent border-r-transparent border-b-blue-100/80"></div>
                      </>
                    )}

                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                        <MessageSquare className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-blue-700 leading-relaxed flex-1">
                        {relationship.message}
                      </span>
                    </div>

                    {/* 요청을 보낸 사람의 말풍선 꼬리 (아래 오른쪽) */}
                    {isRequester && (
                      <>
                        <div className="absolute -bottom-2 right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-blue-100/80"></div>
                        <div className="absolute -bottom-1 right-4 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-blue-100/80"></div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* 요청 상태별 메시지 말풍선 (요청을 받은 사람만) */}
              {!isRequester && relationship.status !== "PENDING" && (
                <div className="relative mt-3">
                  <div className={`relative ${relationship.status === "ACCEPTED" ? 'bg-emerald-100/80' : 'bg-red-100/80'} rounded-2xl px-4 py-5 max-w-xs ml-auto mr-0`}>
                    {/* 응답 말풍선 꼬리 (아래 오른쪽) */}
                    <div className={`absolute -bottom-2 right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent ${relationship.status === "ACCEPTED" ? 'border-t-emerald-100/80' : 'border-t-red-100/80'}`}></div>
                    <div className="absolute -bottom-1 right-4 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-emerald-100/80"></div>

                    <div className="flex items-start gap-2">
                      <div className={`flex-shrink-0 w-5 h-5 ${relationship.status === "ACCEPTED" ? 'bg-emerald-500' : 'bg-red-500'} rounded-full flex items-center justify-center mt-0.5`}>
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                      <span className={`text-sm leading-relaxed flex-1 ${relationship.status === "ACCEPTED" ? 'text-emerald-700' : 'text-red-700'}`}>
                        {relationship.status === "ACCEPTED" && "관계 요청을 승인했습니다"}
                        {relationship.status === "REJECTED" && "관계 요청을 거절했습니다"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 요청을 보낸 사람의 응답 상태 말풍선 */}
              {isRequester && relationship.status !== "PENDING" && (
                <div className="relative mt-3">
                  <div className={`relative ${relationship.status === "ACCEPTED" ? 'bg-emerald-100/80' : 'bg-red-100/80'} rounded-2xl px-4 py-5 max-w-xs`}>
                    {/* 응답 말풍선 꼬리 (아래 왼쪽) */}
                    <div className={`absolute -bottom-2 left-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent ${relationship.status === "ACCEPTED" ? 'border-t-emerald-100/80' : 'border-t-red-100/80'}`}></div>
                    <div className="absolute -bottom-1 left-4 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-emerald-100/80"></div>

                    <div className="flex items-start gap-2">
                      <div className={`flex-shrink-0 w-5 h-5 ${relationship.status === "ACCEPTED" ? 'bg-emerald-500' : 'bg-red-500'} rounded-full flex items-center justify-center mt-0.5`}>
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                      <span className={`text-sm leading-relaxed flex-1 ${relationship.status === "ACCEPTED" ? 'text-emerald-700' : 'text-red-700'}`}>
                        {relationship.status === "ACCEPTED" && "상대방이 요청을 승인했습니다"}
                        {relationship.status === "REJECTED" && "상대방이 요청을 거절했습니다"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 요청을 받은 사람의 대기 상태 말풍선 */}
              {!isRequester && relationship.status === "PENDING" && (
                <div className="relative mt-3">
                  <div className="relative bg-amber-100/80 rounded-2xl px-4 py-5 max-w-xs">
                    {/* 대기 상태 말풍선 꼬리 (아래 오른쪽) */}
                    <div className="absolute -bottom-2 right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-amber-100/80"></div>
                    <div className="absolute -bottom-1 right-4 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-amber-100/80"></div>

                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
                        <Clock className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-amber-700 leading-relaxed flex-1">
                        상대방이 기다리고 있습니다
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 요청을 보낸 사람의 진행 상태 말풍선 */}
              {isRequester && relationship.status === "PENDING" && (
                <div className="relative mt-3">
                  <div className="relative bg-amber-100/80 rounded-2xl px-4 py-5 max-w-xs">
                    {/* 진행중 말풍선 꼬리 (아래 왼쪽) */}
                    <div className="absolute -bottom-2 left-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-amber-100/80"></div>
                    <div className="absolute -bottom-1 left-4 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-amber-100/80"></div>

                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
                        <Clock className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-amber-700 leading-relaxed flex-1">
                        상대방의 응답을 기다리고 있습니다
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* 상태 뱃지 - 말풍선 시스템으로 상태 확인*/}
            {/* {getStatusBadge(relationship.status)} */}

            {/* 승인/거절 버튼 - 쓰레기통 버튼 옆에 배치 */}
            {relationship.status === "PENDING" && !isRequester && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(relationship.id, "ACCEPTED")}
                  className="bg-[#009178] hover:bg-[#007A6B] text-white transition-all duration-200 border-0 rounded-xl h-8 px-3"
                >
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    <span className="text-xs font-medium">승인</span>
                  </div>
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(relationship.id, "REJECTED")}
                  className="bg-gradient-to-r from-slate-100 to-gray-100 hover:from-slate-200 hover:to-gray-200 text-slate-700 transition-all duration-200 rounded-xl h-8 px-3"
                >
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                    <span className="text-xs font-medium">거절</span>
                  </div>
                </Button>
              </>
            )}

            <AlertDialog open={deleteConfirmId === relationship.id} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteConfirmId(relationship.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full p-2 h-8 w-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    관계 삭제
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    정말로 이 관계를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteRelationship(relationship.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    삭제
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <div className="text-xs text-slate-400">
            {new Date(relationship.createdAt).toLocaleDateString()}
          </div>
        </div>

      </motion.div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="w-5 h-5" />
            관계 정보 관리
          </DialogTitle>
          <DialogDescription>
            가족과 친구들과의 관계를 관리하고 새로운 관계를 요청할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="all">전체 관계</TabsTrigger>
            <TabsTrigger value="received">받은 요청</TabsTrigger>
            <TabsTrigger value="sent">보낸 요청</TabsTrigger>
            <TabsTrigger value="new">새 요청</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.6,
                ease: [0.25, 0.46, 0.45, 0.94] 
              }}
              className="space-y-4"
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : allRelationships.length > 0 ? (
                <div className="grid gap-4">
                  {allRelationships.map((relationship) => 
                    getRelationshipCard(relationship, relationship.requesterId === userId)
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>아직 관계가 없습니다.</p>
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="received" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94] 
              }}
              className="space-y-4"
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : receivedRequests.length > 0 ? (
                <div className="grid gap-4">
                  {receivedRequests.map((relationship) => 
                    getRelationshipCard(relationship, false)
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <UserPlus className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>받은 관계 요청이 없습니다.</p>
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94] 
              }}
              className="space-y-4"
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : sentRequests.length > 0 ? (
                <div className="grid gap-4">
                  {sentRequests.map((relationship) => 
                    getRelationshipCard(relationship, true)
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <UserCheck className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>보낸 관계 요청이 없습니다.</p>
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="new" className="space-y-2">
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94] 
              }}
            >
              <Card className="border">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <UserPlus className="w-5 h-5 text-gray-700" />
                    새로운 관계 요청
                  </CardTitle>
                </CardHeader>
              <CardContent className="space-y-6">
                {/* 전화번호 입력 */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    전화번호
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="010-1234-5678"
                      value={newRequest.receiverPhone}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value)
                        setNewRequest({ ...newRequest, receiverPhone: formatted })
                      }}
                      maxLength={13}
                      className="pl-10 h-11 border-gray-200 focus:border-[#009178] focus:ring-[#009178]/20"
                    />
                  </div>
                </div>

                {/* 관계 유형 선택 - 가로 배치 */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">관계 유형</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setNewRequest({ ...newRequest, type: "PARENT_CHILD" })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 ${
                        newRequest.type === "PARENT_CHILD"
                          ? "border-gray-400 bg-gray-100 text-gray-700"
                          : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      {authUser?.userType === "PARENT" ? (
                        <Baby className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">
                        {authUser?.userType === "TEEN" ? "부모" : "자녀"}
                      </span>
                    </button>
                    
                    <button
                      onClick={() => setNewRequest({ ...newRequest, type: "SIBLING" })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 ${
                        newRequest.type === "SIBLING"
                          ? "border-gray-400 bg-gray-100 text-gray-700"
                          : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">형제자매</span>
                    </button>
                    
                    <button
                      onClick={() => setNewRequest({ ...newRequest, type: "FRIEND" })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 ${
                        newRequest.type === "FRIEND"
                          ? "border-gray-400 bg-gray-100 text-gray-700"
                          : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                      <span className="text-sm font-medium">친구</span>
                    </button>
                  </div>
                </div>

                {/* 메시지 입력 */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                    메시지 <span className="text-gray-400 font-normal">(선택사항)</span>
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="관계 요청 메시지를 입력하세요..."
                    value={newRequest.message}
                    onChange={(e) => setNewRequest({ ...newRequest, message: e.target.value })}
                    className="border-gray-200 focus:border-[#009178] focus:ring-[#009178]/20 resize-none"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleCreateRequest}
                  disabled={isCreating || !newRequest.receiverPhone.trim()}
                  className="w-full h-12 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-xl transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      요청 중...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      관계 요청 보내기
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 
"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from "react"
import { ChatbotChat } from "./chatbot-chat"
import { ChatbotIcon } from "./chatbot-icon"
import { useAuthStore } from "@/store/auth"
import { getUserInfo } from "@/lib/api/user"
import { convertNationalIdToBirthDate } from "@/lib/utils"

interface ChatbotContextType {
  isOpen: boolean
  openChatbot: () => void
  closeChatbot: () => void
  toggleChatbot: () => void
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined)

export function useChatbot() {
  const context = useContext(ChatbotContext)
  if (context === undefined) {
    throw new Error("useChatbot must be used within a ChatbotProvider")
  }
  return context
}

interface ChatbotProviderProps {
  children: ReactNode
}

export function ChatbotProvider({ children }: ChatbotProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [userBirthDate, setUserBirthDate] = useState<string>("")
  const { user, isLoggedIn } = useAuthStore()

  const openChatbot = () => setIsOpen(true)
  const closeChatbot = () => setIsOpen(false)
  const toggleChatbot = () => setIsOpen(!isOpen)

  // 사용자 정보에서 생년월일 가져오기
  useEffect(() => {
    const loadUserBirthDate = async () => {
      if (isLoggedIn && user?.id) {
        try {
          console.log("사용자 ID:", user.id)
          console.log("현재 저장된 사용자 정보:", user)
          
          const userInfo = await getUserInfo(user.id)
          console.log("API에서 받아온 사용자 정보:", userInfo)
          
          if (userInfo.nationalIdFront) {
            console.log("주민번호 앞자리:", userInfo.nationalIdFront)
            console.log("주민번호 뒷자리 첫 자리:", userInfo.nationalIdBackFirst)
            
            const birthDate = convertNationalIdToBirthDate(
              userInfo.nationalIdFront, 
              userInfo.nationalIdBackFirst
            )
            console.log("변환된 생년월일:", birthDate)
            setUserBirthDate(birthDate)
          } else {
            console.log("nationalIdFront가 없습니다!")
            console.log("전체 사용자 정보:", userInfo)
            setUserBirthDate("")
          }
        } catch (error) {
          console.error("사용자 생년월일 로드 실패:", error)
        }
      } else {
        console.log("로그인되지 않았거나 사용자 ID가 없습니다:", { isLoggedIn, userId: user?.id })
      }
    }

    loadUserBirthDate()
  }, [isLoggedIn, user?.id])

  return (
    <ChatbotContext.Provider value={{ isOpen, openChatbot, closeChatbot, toggleChatbot }}>
      {children}
      {isLoggedIn && (
        <>
          <ChatbotIcon onToggle={toggleChatbot} isOpen={isOpen} />
          <ChatbotChat isOpen={isOpen} onClose={closeChatbot} userBirthDate={userBirthDate} />
        </>
      )}
    </ChatbotContext.Provider>
  )
}

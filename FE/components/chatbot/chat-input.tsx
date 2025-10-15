"use client"

import { useState, KeyboardEvent, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Send, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  placeholder?: string
  disabled?: boolean
  onFileUpload?: (file: File) => void
}

export function ChatInput({ 
  onSendMessage, 
  placeholder = "메시지를 입력하세요...", 
  disabled = false,
  onFileUpload
}: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isComposing, setIsComposing] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    // IME 조합 중이거나 빈 메시지이거나 비활성화 상태면 전송하지 않음
    if (isComposing || !message.trim() || disabled || isSending) return
    
    // 전송 중 상태로 설정하여 중복 전송 방지
    setIsSending(true)
    
    try {
      // 메시지 전송 후 입력창 초기화
      onSendMessage(message.trim())
      setMessage("")
    } finally {
      // 전송 완료 후 상태 초기화
      setIsSending(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && onFileUpload) {
      onFileUpload(file)
    }
    // 파일 선택 후 input 초기화
    if (event.target) {
      event.target.value = ''
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const native: any = e.nativeEvent as any
    // IME 조합 중이면 전송 방지 (한글 등)
    if (native?.isComposing || native?.keyCode === 229 || isComposing || isSending) return
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="sticky bottom-0 flex items-center gap-3 px-3 py-3 sm:px-4 sm:py-4 bg-white border-t border-gray-100 pb-[max(env(safe-area-inset-bottom),12px)] rounded-b-[32px]">
      {/* 파일 첨부 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="w-10 h-10 rounded-full p-0 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all duration-200"
      >
        <Paperclip className="w-4 h-4" />
      </Button>
      
      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
      />

      <div className="flex-1 relative">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
        />
      </div>
      
      <Button
        onClick={handleSend}
        disabled={!message.trim() || disabled || isSending}
        size="sm"
        className={cn(
          "w-10 h-10 rounded-full p-0 transition-all duration-200",
          message.trim() && !disabled && !isSending
            ? "bg-emerald-500 hover:bg-emerald-600 text-white"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        )}
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  )
}

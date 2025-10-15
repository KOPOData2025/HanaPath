"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bot, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useScrollPosition } from "@/hooks/use-scroll-position"

interface ChatbotIconProps {
  onToggle: () => void
  isOpen: boolean
}

export function ChatbotIcon({ onToggle, isOpen }: ChatbotIconProps) {
  const { isFooterVisible, footerHeight } = useScrollPosition()

  return (
    <div 
      className={cn(
        "fixed right-6 bottom-6 z-50 transition-all duration-500 ease-in-out",
        isFooterVisible 
          ? "opacity-0 scale-95 pointer-events-none" 
          : "opacity-100 scale-100 pointer-events-auto"
      )}
    >
      <Button
        onClick={onToggle}
        size="lg"
        className={cn(
          "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110",
          "bg-gradient-to-br from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700",
          "border-2 border-emerald-400",
          isOpen && "rotate-180"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Bot className="h-6 w-6 text-white" />
        )}
      </Button>
    </div>
  )
}

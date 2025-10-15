"use client"

import React, { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Clock, Check } from "lucide-react"

export interface PollViewOption {
  id: string
  text: string
  votes: number
}

export interface PollViewData {
  question: string
  options: PollViewOption[]
  allowMultiple: boolean
  endsAt?: string
  myOptionIds?: string[]
}

export default function PollView({ poll, onVote }: { poll: PollViewData; onVote?: (selectedIds: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>(() => poll.myOptionIds ?? [])
  React.useEffect(() => {
    setSelected(poll.myOptionIds ?? [])
  }, [poll.myOptionIds])
  const totalVotes = useMemo(() => poll.options.reduce((sum, o) => sum + o.votes, 0), [poll.options])
  const { timeLeftText, isEnded } = useMemo(() => {
    if (!poll.endsAt) return { timeLeftText: undefined as string | undefined, isEnded: false }
    const end = new Date(poll.endsAt).getTime()
    const now = Date.now()
    const diff = end - now
    if (diff <= 0) return { timeLeftText: "마감됨", isEnded: true }
    const d = Math.floor(diff / (1000 * 60 * 60 * 24))
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const parts: string[] = []
    if (d > 0) parts.push(`${d}일`)
    if (h > 0) parts.push(`${h}시간`)
    parts.push(`${m}분`)
    return { timeLeftText: `${parts.join(" ")} 남음`, isEnded: false }
  }, [poll.endsAt])

  const toggle = (id: string) => {
    if (isEnded) return
    if (poll.allowMultiple) {
      setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    } else {
      setSelected((prev) => (prev.includes(id) ? [] : [id]))
    }
  }

  const handleVote = () => {
    if (selected.length === 0) return
    onVote?.(selected)
  }

  return (
    <div className="rounded-2xl border-0 bg-slate-50/50 p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-slate-600 text-white flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <p className="font-semibold text-slate-800 truncate">{poll.question}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {poll.allowMultiple && <Badge className="bg-slate-600/90">복수 선택</Badge>}
          {poll.endsAt && (
            <Badge variant="outline" className={`border-slate-300 ${isEnded ? "text-slate-500" : "text-slate-600"}`}>
              <Clock className="w-3.5 h-3.5 mr-1" /> {timeLeftText}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {poll.options.map((opt) => {
          const percent = totalVotes ? Math.round((opt.votes / totalVotes) * 100) : 0
          const isSelected = selected.includes(opt.id)
          return (
            <motion.button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              whileHover={isEnded ? undefined : { scale: 1.01 }}
              whileTap={isEnded ? undefined : { scale: 0.99 }}
              disabled={isEnded}
              className={`relative w-full text-left p-3 rounded-xl border-2 bg-white transition-all ${
                isEnded
                  ? "border-slate-200 opacity-60 cursor-not-allowed"
                  : isSelected
                  ? "border-slate-600 shadow-[0_0_0_4px] shadow-slate-600/10"
                  : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-full border-2 ${
                      isSelected ? "border-slate-600 bg-slate-600 text-white" : "border-slate-300"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </span>
                  <span className="font-medium text-slate-800 truncate">{opt.text}</span>
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">{percent}% ({opt.votes})</span>
              </div>
              <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className={`absolute left-0 top-0 h-full rounded-full ${
                    isSelected ? "bg-slate-600/90" : "bg-slate-400"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.button>
          )
        })}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500 pt-1">
        <span>총 투표수: {totalVotes}</span>
        <Button
          size="sm"
          className="bg-slate-600/90 hover:bg-slate-700/90"
          disabled={selected.length === 0 || isEnded}
          onClick={handleVote}
        >
          {isEnded ? "마감됨" : "투표하기"}
        </Button>
      </div>
    </div>
  )
}



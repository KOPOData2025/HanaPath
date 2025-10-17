"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"
import { Plus, Trash2, Calendar as CalendarIcon } from "lucide-react"

export interface PollOption {
  id: string
  text: string
}

export interface PollData {
  question: string
  options: PollOption[]
  allowMultiple: boolean
  endsAt?: string // ISO string
}

interface PollCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (poll: PollData) => void
  defaultValue?: PollData
}

export default function PollCreateModal({ isOpen, onClose, onSubmit, defaultValue }: PollCreateModalProps) {
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState<PollOption[]>([])
  const [allowMultiple, setAllowMultiple] = useState(false)
  const [endsAt, setEndsAt] = useState<string | undefined>(undefined)
  const [endsDate, setEndsDate] = useState<Date | undefined>(undefined)
  const maxOptions = 6

  useEffect(() => {
    if (isOpen) {
      setQuestion(defaultValue?.question ?? "")
      setOptions(defaultValue?.options ?? [
        { id: crypto.randomUUID(), text: "" },
        { id: crypto.randomUUID(), text: "" },
      ])
      setAllowMultiple(defaultValue?.allowMultiple ?? false)
      setEndsAt(defaultValue?.endsAt)
      setEndsDate(defaultValue?.endsAt ? new Date(defaultValue.endsAt) : undefined)
    }
  }, [isOpen, defaultValue])

  const canSubmit = useMemo(() => {
    const validOptions = options.filter((o) => o.text.trim().length > 0)
    return question.trim().length > 0 && validOptions.length >= 2 && !!endsDate
  }, [question, options, endsDate])

  const addOption = () => {
    if (options.length >= maxOptions) {
      toast.info("옵션 제한", { description: `옵션은 최대 ${maxOptions}개까지 가능합니다.` })
      return
    }
    setOptions((prev) => [...prev, { id: crypto.randomUUID(), text: "" }])
  }

  const removeOption = (id: string) => {
    setOptions((prev) => prev.filter((o) => o.id !== id))
  }

  const updateOption = (id: string, text: string) => {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)))
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    const trimmed = options.map((o) => ({ ...o, text: o.text.trim() })).filter((o) => o.text.length > 0)
    // endsAt은 날짜만 선택하므로 선택한 날의 23:59:59로 설정
    let finalEndsAt: string | undefined = undefined
    if (endsDate) {
      const d = new Date(endsDate)
      d.setHours(23, 59, 59, 999)
      finalEndsAt = d.toISOString()
    }
    onSubmit?.({ question: question.trim(), options: trimmed, allowMultiple, endsAt: finalEndsAt })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>투표 추가</DialogTitle>
          <DialogDescription>질문과 보기 옵션을 설정하세요</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* 질문 */}
          <div className="space-y-2">
            <Label className="text-sm">질문</Label>
            <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="예: 어떤 주제를 토론할까요?" />
          </div>

          {/* 옵션들 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">옵션</Label>
              <Button type="button" variant="outline" onClick={addOption} className="h-8 px-3 border-slate-600 text-slate-800 hover:bg-slate-600 hover:text-white">
                <Plus className="w-4 h-4 mr-1" /> 옵션 추가
              </Button>
            </div>
            <div className="space-y-2">
              {options.map((opt, index) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <Input
                    value={opt.text}
                    onChange={(e) => updateOption(opt.id, e.target.value)}
                    placeholder={`옵션 ${index + 1}`}
                    className="flex-1"
                  />
                  <Button type="button" variant="ghost" onClick={() => removeOption(opt.id)} className="text-slate-500 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* 설정 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border-0 p-4 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">복수 선택 허용</p>
                <p className="text-xs text-slate-500">여러 개의 옵션을 선택할 수 있습니다</p>
              </div>
              <Switch checked={allowMultiple} onCheckedChange={setAllowMultiple} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2"><CalendarIcon className="w-4 h-4" />마감 날짜 (필수)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endsDate ? endsDate.toLocaleDateString() : "날짜 선택"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endsDate}
                    onSelect={(d) => {
                      setEndsDate(d ?? undefined)
                      if (!d) {
                        setEndsAt(undefined)
                      }
                    }}
                    disabled={(date) => {
                      const today = new Date(); today.setHours(0,0,0,0)
                      return date < today
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-slate-500">선택한 날짜의 23:59에 마감됩니다.</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} className="bg-slate-600/90 hover:bg-slate-700/90">추가</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}



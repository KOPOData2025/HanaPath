"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Edit3, Hash, ImagePlus, Sparkles, X, Upload, Vote } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import PollCreateModal, { PollData } from "@/components/community/poll-create-modal"
import PollView from "@/components/community/poll-view"

export type CommunityCategory = "investment" | "education" | "qna"

export interface PostFormData {
  title: string
  content: string
  category: CommunityCategory
  tags: string[]
}

interface PostCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: PostFormData) => Promise<void> | void
  defaultCategory?: CommunityCategory
  initialValue?: Partial<PostFormData>
  mode?: 'create' | 'edit'
  submitLabel?: string
}

export default function PostCreateModal({ isOpen, onClose, onSubmit, defaultCategory = "investment", initialValue, mode = 'create', submitLabel }: PostCreateModalProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState<CommunityCategory>(defaultCategory)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isComposing, setIsComposing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isPollModalOpen, setIsPollModalOpen] = useState(false)
  const [poll, setPoll] = useState<PollData | null>(null)

  const titleLimit = 60
  const contentLimit = 1000
  const tagLimit = 5

  useEffect(() => {
    if (isOpen) {
      setTitle(initialValue?.title ?? "")
      setContent(initialValue?.content ?? "")
      setCategory((initialValue?.category as CommunityCategory) ?? defaultCategory)
      setTags(initialValue?.tags ?? [])
    }
  }, [isOpen, initialValue, defaultCategory])

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && content.trim().length > 0
  }, [title, content])

  const clearForm = () => {
    setTitle("")
    setContent("")
    setCategory(defaultCategory)
    setTags([])
    setTagInput("")
    setPoll(null)
  }

  const handleClose = () => {
    clearForm()
    onClose()
  }

  const addTag = (raw: string) => {
    const t = raw.replace(/[#,]/g, "").trim()
    if (!t) return
    if (tags.includes(t)) return
    if (tags.length >= tagLimit) {
      toast.info("태그 제한 초과", { description: `태그는 최대 ${tagLimit}개까지 가능합니다.` })
      return
    }
    setTags((prev) => [...prev, t])
    setTagInput("")
  }

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t))

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Ignore Enter/Comma while IME composition is active (e.g., Korean input)
    const nativeEvent = e.nativeEvent as unknown as { isComposing?: boolean; keyCode?: number; key?: string }
    if (isComposing || nativeEvent?.isComposing || nativeEvent?.keyCode === 229 || nativeEvent?.key === "Process") {
      return
    }

    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    try {
      setSubmitting(true)
      const payload: PostFormData & { poll?: PollData } = { title: title.trim(), content: content.trim(), category, tags }
      if (poll) payload.poll = poll
      await onSubmit?.(payload)
      toast.success("게시글 등록 완료", { description: "게시글이 정상적으로 등록되었습니다." })
      handleClose()
    } catch (error) {
      console.error(error)
      toast.error("게시글 등록 실패", { description: "잠시 후 다시 시도해주세요." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            {mode === 'edit' ? '글 수정' : '글 작성'}
          </DialogTitle>
          <DialogDescription>커뮤니티에 공유할 내용을 작성해주세요</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* 카테고리 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <Label className="text-sm text-gray-700">카테고리</Label>
            <div className="md:col-span-2">
              <Select value={category} onValueChange={(v: CommunityCategory) => setCategory(v)}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="investment">투자 토론</SelectItem>
                  <SelectItem value="education">금융 교육</SelectItem>
                  <SelectItem value="qna">자유 게시판</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 제목 */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-700">제목</Label>
            <div className="relative">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, titleLimit))}
                placeholder="제목을 입력하세요"
                className="h-11"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {title.length}/{titleLimit}
              </span>
            </div>
          </div>

          {/* 내용 */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-700">내용</Label>
            <div className="relative">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, contentLimit))}
                placeholder="공유하고 싶은 내용을 자유롭게 작성해 주세요"
                className="min-h-[160px] resize-y"
              />
              <div className="flex justify-between mt-1 text-xs">
                <div className="text-gray-400">예의를 지켜주세요</div>
                <div className="text-gray-400">{content.length}/{contentLimit}</div>
              </div>
            </div>
          </div>

          {/* 태그 */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-700">태그</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={(e) => {
                    setIsComposing(false)
                    // Ensure input state reflects the finalized composition string
                    setTagInput(e.currentTarget.value)
                  }}
                  onKeyDown={handleTagKeyDown}
                  placeholder="태그를 입력 후 Enter (최대 5개)"
                  className="pl-9"
                />
                <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <Button type="button" variant="outline" onClick={() => addTag(tagInput)} className="whitespace-nowrap">
                추가
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary" className="px-2 py-1 bg-teal-50 text-teal-700 border border-teal-200">
                    <div className="flex items-center gap-1">
                      <span>#{t}</span>
                      <button onClick={() => removeTag(t)} className="ml-1 text-gray-400 hover:text-gray-600">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 투표 추가 및 미리보기 */}
          <div className="space-y-3">
            {!poll ? (
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-700">투표</Label>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsPollModalOpen(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5 shadow-sm text-sm"
                >
                  <Vote className="w-4 h-4" />
                  <span className="text-xs">투표 추가</span>
                </Button>
              </div>
            ) : null}

            {poll ? (
              <Accordion type="single" collapsible className="rounded-2xl border border-slate-200 bg-teal-50/40">
                <AccordionItem value="poll" className="border-0">
                  <div className="flex items-center justify-between px-4 pt-3">
                    <Label className="text-sm text-gray-700">투표</Label>
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="icon" aria-label="투표 수정" onClick={() => setIsPollModalOpen(true)} className="h-7 w-7 text-gray-500 hover:text-teal-700">
                        <Vote className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="투표 제거" onClick={() => setPoll(null)} className="h-8 w-8 text-gray-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="text-left w-full">
                      <p className="font-medium text-gray-800 truncate">{poll.question}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        옵션 {poll.options.length}개 · 마감 {poll.endsAt ? new Date(poll.endsAt).toLocaleDateString() : '미설정'} · {poll.allowMultiple ? '복수 선택' : '단일 선택'}
                      </p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <PollView
                      poll={{
                        question: poll.question,
                        allowMultiple: poll.allowMultiple,
                        endsAt: poll.endsAt,
                        options: poll.options.map((o) => ({ id: o.id, text: o.text, votes: 0 })),
                      }}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <p className="text-xs text-gray-500">투표를 추가하면 게시글에 함께 표시됩니다.</p>
            )}
          </div>

          {/* 첨부 안내 (옵션) - 접이식 (맨 아래로 이동) */}
          <Accordion type="single" collapsible>
            <AccordionItem value="attachments" className="rounded-xl border border-dashed border-slate-300 bg-teal-50/40">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                      <ImagePlus className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-800">이미지 첨부 (선택)</p>
                      <p className="text-xs text-gray-500">드래그 앤 드롭 또는 버튼을 눌러 선택</p>
                    </div>
                  </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    aria-label="이미지 업로드"
                    variant="ghost"
                    className="h-9 w-9 rounded-full text-teal-700 hover:bg-teal-600 hover:text-white"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                  <AccordionTrigger
                    className="p-0 h-9 w-9 rounded-full flex items-center justify-center hover:no-underline data-[state=open]:rotate-180 transition-transform"
                    aria-label="자세히"
                  >
                    <span className="sr-only">자세히</span>
                  </AccordionTrigger>
                </div>
              </div>
              <AccordionContent className="p-0 data-[state=open]:px-4 data-[state=open]:pb-4 data-[state=closed]:pb-0">
                <div className="grid place-items-center text-xs text-gray-500 px-4 pb-2">
                  선택한 파일 미리보기와 추가 옵션은 펼쳐서 확인하세요.
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter className="gap-2">
          <Button size="sm" variant="outline" onClick={handleClose} disabled={submitting}>
            취소
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!canSubmit || submitting} className="bg-teal-600 hover:bg-teal-700">
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                {mode === 'edit' ? '수정 중...' : '등록 중...'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                {submitLabel ?? (mode === 'edit' ? '수정' : '등록')}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
      <PollCreateModal
        isOpen={isPollModalOpen}
        onClose={() => setIsPollModalOpen(false)}
        onSubmit={(p) => setPoll(p)}
        defaultValue={poll ?? undefined}
      />
    </Dialog>
  )
}



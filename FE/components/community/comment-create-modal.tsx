// "use client"

// import { useMemo, useState } from "react"
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { Textarea } from "@/components/ui/textarea"
// import { toast } from "sonner"
// import { MessageCircle, SendHorizonal } from "lucide-react"

// interface CommentCreateModalProps {
//   isOpen: boolean
//   onClose: () => void
//   onSubmit?: (content: string) => Promise<void> | void
// }

// export default function CommentCreateModal({ isOpen, onClose, onSubmit }: CommentCreateModalProps) {
//   const [content, setContent] = useState("")
//   const [submitting, setSubmitting] = useState(false)
//   const limit = 500

//   const canSubmit = useMemo(() => content.trim().length > 0, [content])

//   const handleClose = () => {
//     setContent("")
//     onClose()
//   }

//   const handleSubmit = async () => {
//     if (!canSubmit) return
//     try {
//       setSubmitting(true)
//       await onSubmit?.(content.trim())
//       toast.success("댓글 등록 완료", { description: "댓글이 정상적으로 등록되었습니다." })
//       handleClose()
//     } catch (error) {
//       console.error(error)
//       toast.error("댓글 등록 실패", { description: "잠시 후 다시 시도해주세요." })
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   return (
//     <Dialog open={isOpen} onOpenChange={handleClose}>
//       <DialogContent className="max-w-lg rounded-2xl">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
//               <MessageCircle className="w-5 h-5 text-white" />
//             </div>
//             댓글 작성
//           </DialogTitle>
//           <DialogDescription>댓글을 입력해주세요..</DialogDescription>
//         </DialogHeader>

//         <div className="space-y-3">
//           <Textarea
//             value={content}
//             onChange={(e) => setContent(e.target.value.slice(0, limit))}
//             placeholder="댓글을 입력해주세요.."
//             className="min-h-[120px] resize-y"
//           />
//           <div className="flex justify-end text-xs text-gray-400">{content.length}/{limit}</div>
//         </div>

//         <DialogFooter>
//           <Button variant="outline" onClick={handleClose} disabled={submitting}>
//             취소
//           </Button>
//           <Button onClick={handleSubmit} disabled={!canSubmit || submitting} className="bg-teal-600 hover:bg-teal-700">
//             {submitting ? (
//               <div className="flex items-center gap-2">
//                 <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
//                 등록 중...
//               </div>
//             ) : (
//               <div className="flex items-center gap-2">
//                 <SendHorizonal className="w-4 h-4" />
//                 등록
//               </div>
//             )}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }



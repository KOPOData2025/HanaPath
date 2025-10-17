// "use client"

// import { useEffect, useMemo, useState } from "react"
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { Textarea } from "@/components/ui/textarea"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { toast } from "sonner"
// import { communityApi } from "@/lib/api/community"
// import type { CommentResponse } from "@/types/community"
// import { MessageCircle, Trash2 } from "lucide-react"

// interface CommentListModalProps {
//   isOpen: boolean
//   onClose: () => void
//   postId: number | null
//   currentUserId?: number | null
//   onChanged?: (count: number) => void
// }

// export default function CommentListModal({ isOpen, onClose, postId, currentUserId, onChanged }: CommentListModalProps) {
//   const [comments, setComments] = useState<CommentResponse[]>([])
//   const [loading, setLoading] = useState(false)
//   const [content, setContent] = useState("")
//   const [submitting, setSubmitting] = useState(false)
//   const limit = 500

//   const canSubmit = useMemo(() => content.trim().length > 0, [content])

//   const load = async () => {
//     if (!postId) return
//     try {
//       setLoading(true)
//       const list = await communityApi.listComments(postId)
//       setComments(list)
//       onChanged?.(list.length)
//     } catch (e) {
//       console.error(e)
//       toast.error("댓글 로드 실패", { description: "잠시 후 다시 시도해주세요." })
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     if (isOpen) {
//       load()
//     } else {
//       setComments([])
//       setContent("")
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isOpen, postId])

//   const handleCreate = async () => {
//     if (!postId || !canSubmit) return
//     try {
//       setSubmitting(true)
//       const created = await communityApi.createComment(postId, { content: content.trim() })
//       setComments((prev) => [...prev, created])
//       onChanged?.(comments.length + 1)
//       setContent("")
//       toast.success("댓글 등록 완료", { description: "댓글이 정상적으로 등록되었습니다." })
//     } catch (e) {
//       console.error(e)
//       toast.error("댓글 등록 실패", { description: "잠시 후 다시 시도해주세요." })
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   const handleDelete = async (commentId: number) => {
//     try {
//       await communityApi.deleteComment(commentId)
//       setComments((prev) => {
//         const next = prev.filter((c) => c.id !== commentId)
//         onChanged?.(next.length)
//         return next
//       })
//       toast.success("댓글 삭제 완료", { description: "댓글이 정상적으로 삭제되었습니다." })
//     } catch (e) {
//       console.error(e)
//       toast.error("댓글 삭제 실패", { description: "본인이 작성한 댓글만 삭제할 수 있습니다." })
//     }
//   }

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-lg rounded-2xl">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
//               <MessageCircle className="w-5 h-5 text-white" />
//             </div>
//             댓글
//           </DialogTitle>
//           <DialogDescription>정중하게 소통해요</DialogDescription>
//         </DialogHeader>

//         <div className="space-y-4">
//           <ScrollArea className="max-h-64 pr-2">
//             {loading ? (
//               <div className="text-sm text-gray-500">불러오는 중...</div>
//             ) : comments.length === 0 ? (
//               <div className="text-sm text-gray-400">아직 댓글이 없습니다</div>
//             ) : (
//               <div className="space-y-3">
//                 {comments.map((c) => (
//                   <div key={c.id} className="flex items-start justify-between gap-3 border-b pb-2">
//                     <div className="flex-1">
//                       <div className="text-sm font-medium text-gray-800">{c.authorNickname ?? "익명"}</div>
//                       <div className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</div>
//                       <div className="text-xs text-gray-400 mt-1">{new Date(c.createdAt).toLocaleString()}</div>
//                     </div>
//                     {currentUserId && c.authorId === currentUserId ? (
//                       <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} aria-label="댓글 삭제">
//                         <Trash2 className="w-4 h-4 text-red-600" />
//                       </Button>
//                     ) : null}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </ScrollArea>

//           <div>
//             <Textarea
//               value={content}
//               onChange={(e) => setContent(e.target.value.slice(0, limit))}
//               placeholder="댓글을 입력해주세요.."
//               className="min-h-[100px]"
//             />
//             <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
//               <div />
//               <div>
//                 {content.length}/{limit}
//               </div>
//             </div>
//           </div>
//         </div>

//         <DialogFooter>
//           <Button variant="outline" onClick={onClose} disabled={submitting}>닫기</Button>
//           <Button onClick={handleCreate} disabled={!canSubmit || submitting} className="bg-teal-600 hover:bg-teal-700">
//             {submitting ? "등록 중..." : "등록"}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }



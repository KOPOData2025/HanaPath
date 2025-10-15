"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Heart, Clock, ArrowLeft, Trash2, Flag, Share2, MessageCircle, BarChart3, Send, MoreHorizontal, Pencil } from "lucide-react"
import { communityApi } from "@/lib/api/community"
import type { CommentResponse, PostResponse } from "@/types/community"
import PollView, { type PollViewData } from "@/components/community/poll-view"
import { useAuthStore } from "@/store/auth"
import { toast } from "sonner"
import PostCreateModal from "@/components/community/post-create-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"

// 레벨별 설정
const levelEmojis = {
  1: "🌰",
  2: "🌱",
  3: "🌿",
  4: "🍏",
  5: "🌳",
}

const levelColors = {
  1: "from-green-400 to-green-600",
  2: "from-blue-400 to-blue-600",
  3: "from-purple-400 to-purple-600",
  4: "from-orange-400 to-orange-600",
  5: "from-yellow-400 to-yellow-600",
}

const levelLabels = {
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
}

export default function CommunityDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const idNum = Number(params?.id)

  const [post, setPost] = useState<PostResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [liking, setLiking] = useState(false)
  const [comments, setComments] = useState<CommentResponse[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentContent, setCommentContent] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const currentUserId = useAuthStore((s) => s.user?.id ?? null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const commentsRef = useRef<HTMLDivElement | null>(null)

  const load = async () => {
    if (!idNum) return
    try {
      setLoading(true)
      const data = await communityApi.getPost(idNum)
      setPost(data)
    } catch (e) {
      console.error(e)
      toast.error("게시글을 불러올 수 없습니다")
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    if (!idNum) return
    try {
      setLoadingComments(true)
      const list = await communityApi.listComments(idNum)
      setComments(list)
      setPost((prev) => (prev ? { ...prev, commentCount: list.length } : prev))
    } catch (e) {
      console.error(e)
      toast.error("댓글 로드 실패", { description: "잠시 후 다시 시도해주세요." })
    } finally {
      setLoadingComments(false)
    }
  }

  useEffect(() => {
    load()
    loadComments()
  }, [idNum])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#comments') {
      setTimeout(() => commentsRef.current?.scrollIntoView({ behavior: 'smooth' }), 0)
    }
  }, [commentsRef.current])

  const [poll, setPoll] = useState<PollViewData | undefined>(undefined)

  useEffect(() => {
    const loadPoll = async () => {
      if (!idNum) return
      try {
        const p = await communityApi.getPoll(idNum)
        if (p && Array.isArray(p.options)) {
          const next: PollViewData = {
            question: String(p.question ?? ''),
            allowMultiple: !!p.allowMultiple,
            endsAt: p.endsAt ? String(p.endsAt) : undefined,
            options: p.options.map((o: any) => ({ id: String(o.id), text: String(o.text ?? ''), votes: Number(o.votes ?? 0) })),
            myOptionIds: Array.isArray(p.myOptionIds) ? p.myOptionIds.map((x: any) => String(x)) : undefined,
          }
          setPoll(next)
        } else {
          setPoll(undefined)
        }
      } catch (e) {
        // 투표가 없는 게시글이거나 404/500 등일 수 있음 
        setPoll(undefined)
      }
    }
    loadPoll()
  }, [idNum])

  const handleToggleLike = async () => {
    if (!post || liking) return
    try {
      setLiking(true)
      const active = await communityApi.toggleLike(post.id)
      setPost((prev) => prev ? ({ ...prev, likedByMe: active, likeCount: Math.max(0, prev.likeCount + (active ? 1 : -1)) }) : prev)
    } catch (e) {
      console.error(e)
      toast.error('좋아요 실패', { description: '잠시 후 다시 시도해주세요.' })
    } finally {
      setLiking(false)
    }
  }

  const canSubmit = useMemo(() => commentContent.trim().length > 0, [commentContent])

  const handleCreateComment = async () => {
    if (!post || !canSubmit) return
    try {
      setSubmittingComment(true)
      const created = await communityApi.createComment(post.id, { content: commentContent.trim() })
      setComments((prev) => [...prev, created])
      setPost((prev) => prev ? ({ ...prev, commentCount: prev.commentCount + 1 }) : prev)
      setCommentContent("")
      toast.success("댓글 등록 완료", { description: "댓글이 정상적으로 등록되었습니다." })
    } catch (e) {
      console.error(e)
      toast.error("댓글 등록 실패", { description: "잠시 후 다시 시도해주세요." })
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    try {
      await communityApi.deleteComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      setPost((prev) => prev ? ({ ...prev, commentCount: Math.max(0, (prev.commentCount ?? 0) - 1) }) : prev)
      toast.success("댓글 삭제 완료", { description: "댓글이 정상적으로 삭제되었습니다." })
    } catch (e) {
      console.error(e)
      toast.error("삭제 실패", { description: "본인이 작성한 댓글만 삭제할 수 있습니다." })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-sm text-gray-500">불러오는 중...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-sm text-gray-400">게시글을 찾을 수 없습니다.</div>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/community')}>목록으로</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-4">
          <Button variant="outline" className="rounded-full" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> 뒤로가기
          </Button>
        </div>

        <Card className="rounded-3xl border border-white/20 bg-white/60 backdrop-blur-md supports-[backdrop-filter]:bg-white/40 shadow-2xl overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-xl shadow-lg">
                      {levelEmojis[post.authorLevel as keyof typeof levelEmojis] || "👤"}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br ${levelColors[post.authorLevel as keyof typeof levelColors] || "from-gray-400 to-gray-600"} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg`}
                    >
                      {levelLabels[post.authorLevel as keyof typeof levelLabels] || "?"}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-gray-800 text-lg">{post.title || '제목 없음'}</span>
                      <Badge variant="outline" className="text-xs border-gray-200 bg-gray-50">
                        {post.category === 'INVESTMENT' ? '투자 토론' : post.category === 'EDUCATION' ? '금융 교육' : '자유 게시판'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="text-gray-700 font-medium">{post.authorNickname ?? '익명'}</span>
                      <span className="text-gray-300">·</span>
                      <span className="inline-flex items-center"><Clock className="w-3 h-3 mr-1" /> {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ko })}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant={post.likedByMe ? 'default' : 'outline'} size="sm" className={post.likedByMe ? 'bg-[#009178] hover:bg-[#004E42] text-white rounded-full' : 'rounded-full'} onClick={handleToggleLike} disabled={liking}>
                  <Heart className={`w-4 h-4 mr-1 ${post.likedByMe ? 'fill-current' : ''}`} /> {post.likeCount}
                </Button>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => toast.success('신고 완료', { description: '해당 게시글 신고가 접수되었습니다.' })}>
                  <Flag className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigator?.share?.({ title: post.title || '커뮤니티 게시글', text: post.content.slice(0, 120), url: typeof window !== 'undefined' ? window.location.href : undefined }).catch(() => {})}>
                  <Share2 className="w-4 h-4" />
                </Button>
                {currentUserId && post.authorId === currentUserId ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="rounded-full" aria-label="더보기">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[6rem] w-auto">
                      <DropdownMenuItem className="justify-center px-1 gap-1" onClick={() => setIsEditOpen(true)}>
                        <Pencil className="w-4 h-4" />
                        <span>수정</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="justify-center px-1 gap-1 text-red-600 focus:bg-red-50" onClick={() => setConfirmDelete(true)}>
                        <Trash2 className="w-4 h-4" />
                        <span>삭제</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
            </div>

            <div className="mt-4 text-gray-800 whitespace-pre-wrap leading-relaxed text-[15px]">{post.content}</div>

            {poll ? (
              <div className="mt-6">
                <PollView poll={poll} onVote={async (selected) => {
                  try {
                    await communityApi.vote(post.id, selected.map((s) => Number(s)))
                    const p = await communityApi.getPoll(post.id)
                    const next: PollViewData = {
                      question: String(p.question ?? ''),
                      allowMultiple: !!p.allowMultiple,
                      endsAt: p.endsAt ? String(p.endsAt) : undefined,
                      options: p.options.map((o: any) => ({ id: String(o.id), text: String(o.text ?? ''), votes: Number(o.votes ?? 0) })),
                      myOptionIds: Array.isArray(p.myOptionIds) ? p.myOptionIds.map((x: any) => String(x)) : undefined,
                    }
                    setPoll(next)
                  } catch (e) {
                    console.error(e)
                    toast.error('투표 실패', { description: '잠시 후 다시 시도해주세요.' })
                  }
                }} />
              </div>
            ) : null}

            {post.tags?.length ? (
              <div className="flex flex-wrap gap-2 mt-6">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs bg-[#009178]/10 text-[#009178]">#{tag}</Badge>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* 댓글 */}
        <div ref={commentsRef} id="comments" className="mt-8" />
        <Card className="rounded-3xl border border-white/20 bg-white/60 backdrop-blur-md supports-[backdrop-filter]:bg-white/40 shadow-xl overflow-hidden mt-4">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-bold text-gray-800">댓글 {post.commentCount}</h2>
            </div>

            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {loadingComments ? (
                <div className="text-sm text-gray-500">불러오는 중...</div>
              ) : comments.length === 0 ? (
                <div className="text-sm text-gray-400">아직 댓글이 없습니다</div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex items-start justify-between gap-3 border-b pb-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">{c.authorNickname ?? '익명'}</div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</div>
                      <div className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: ko })}</div>
                    </div>
                    {currentUserId && c.authorId === currentUserId ? (
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteComment(c.id)} aria-label="댓글 삭제">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    ) : null}
                  </div>
                ))
              )}
            </div>

            <div className="mt-4">
              <Textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="댓글을 입력해주세요.."
                className="min-h-[80px]"
              />
              <div className="mt-3 flex items-center justify-end">
                <Button
                  size="icon"
                  aria-label="댓글 등록"
                  className="rounded-full bg-[#009178] hover:bg-[#004E42]"
                  disabled={!canSubmit || submittingComment}
                  onClick={handleCreateComment}
                >
                  {submittingComment ? (
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
      {/* 수정 모달 */}
      <PostCreateModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        defaultCategory={post.category === 'INVESTMENT' ? 'investment' : post.category === 'EDUCATION' ? 'education' : 'qna'}
        mode={'edit'}
        initialValue={{
          title: post.title,
          content: post.content,
          category: post.category === 'INVESTMENT' ? 'investment' : post.category === 'EDUCATION' ? 'education' : 'qna',
          tags: post.tags,
        }}
        submitLabel={'수정'}
        onSubmit={async (payload: any) => {
          try {
            const updated = await communityApi.updatePost(post.id, payload)
            setPost(updated)
            toast.success('수정 완료', { description: '게시글이 정상적으로 수정되었습니다.' })
          } catch (e) {
            console.error(e)
            toast.error('수정 실패', { description: '잠시 후 다시 시도해주세요.' })
          } finally {
            setIsEditOpen(false)
          }
        }}
      />

      {/* 삭제 확인 */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>게시글 삭제</AlertDialogTitle>
            <AlertDialogDescription>정말 이 게시글을 삭제하시겠어요? 되돌릴 수 없어요.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                try {
                  await communityApi.deletePost(post.id)
                  toast.success('삭제 완료', { description: '게시글이 정상적으로 삭제되었습니다.' })
                  router.push('/community')
                } catch (e) {
                  console.error(e)
                  toast.error('삭제 실패', { description: '본인이 작성한 글만 삭제할 수 있습니다.' })
                } finally {
                  setConfirmDelete(false)
                }
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}


